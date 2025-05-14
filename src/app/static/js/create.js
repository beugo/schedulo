class UnitModel {
    constructor({ unit_name, unit_code, semester1, semester2, exam, prerequisites }) {
        this.unit_name = unit_name;
        this.unit_code = unit_code;
        this.semester1 = semester1;
        this.semester2 = semester2;
        this.exam = exam;
        this.prerequisites = prerequisites || "";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // ───── Constants & State ─────
    const searchInput  = document.getElementById('searchInput');
    const saveButton   = document.getElementById('saveButton');
    const unitList     = document.getElementById('unitList');
    const planName     = document.getElementById('planName');
    const cellSelector = '.unit-cell';
    const dropZones    = Array.from(document.querySelectorAll(cellSelector));
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    let allUnits = [];
    let availableUnits = [];
    let placedUnits = {}; // cell key is unit_code
    const prefillTemplates = {
        cs: [
            { unit_code: 'CITS1401', row: 1, col: 1 },
            { unit_code: 'CITS1402', row: 1, col: 2 },
            { unit_code: 'CITS1003', row: 2, col: 1 },
            { unit_code: 'CITS2005', row: 3, col: 1 },
            { unit_code: 'CITS2200', row: 3, col: 2 },
            { unit_code: 'CITS2002', row: 4, col: 1 },
            { unit_code: 'CITS2211', row: 4, col: 2 },
            { unit_code: 'CITS3403', row: 5, col: 1 },
            { unit_code: 'CITS3002', row: 5, col: 2 },
            { unit_code: 'CITS3007', row: 5, col: 3 },
            { unit_code: 'CITS3200', row: 6, col: 1 },
            { unit_code: 'CITS3001', row: 6, col: 2 }
            ],
        cyber: [
            { unit_code: 'CITS1401', row: 1, col: 1 },
            { unit_code: 'PHIL1001', row: 1, col: 2 },
            { unit_code: 'CITS1003', row: 2, col: 1 },
            { unit_code: 'CITS2006', row: 3, col: 1 },
            { unit_code: 'CITS2002', row: 4, col: 1 },
            { unit_code: 'CITS3002', row: 5, col: 1 },
            { unit_code: 'CITS3403', row: 5, col: 2 },
            { unit_code: 'CITS3007', row: 5, col: 3 },
            { unit_code: 'CITS3200', row: 6, col: 1 },
            { unit_code: 'CITS3006', row: 6, col: 2 },
            ],
        cs_cyber: [
            { unit_code: 'CITS1401', row: 1, col: 1 },
            { unit_code: 'PHIL1001', row: 1, col: 2 },
            { unit_code: 'CITS1402', row: 1, col: 3 },
            { unit_code: 'CITS1003', row: 2, col: 1 },
            { unit_code: 'CITS2006', row: 3, col: 1 },
            { unit_code: 'CITS2200', row: 3, col: 2 },
            { unit_code: 'CITS2005', row: 3, col: 3 },
            { unit_code: 'CITS2002', row: 4, col: 1 },
            { unit_code: 'CITS2211', row: 4, col: 2 },
            { unit_code: 'CITS3002', row: 5, col: 1 },
            { unit_code: 'CITS3403', row: 5, col: 2 },
            { unit_code: 'CITS3007', row: 5, col: 3 },
            { unit_code: 'CITS3200', row: 6, col: 1 },
            { unit_code: 'CITS3006', row: 6, col: 2 },
            { unit_code: 'CITS3001', row: 6, col: 3 },
            { unit_code: 'CITS3005', row: 6, col: 4 }
            ],
    }

    // ───── Initialization ─────
    function init() {
        applyInitialPlan();
        loadUnits();
        setupPrefillHandler();
        setupSearchFilter();
        setupSaveHandler();
        setupDragAndDrop();
    }

    // ───── Initial render of grid ─────
    async function applyInitialPlan() {
        // 1) fetch existing plan 
        let init = { name: '', units: [] };
        const planId = new URLSearchParams(window.location.search).get('id');
        if (planId) {
          try {
            const resp = await fetch(`/plans/get?id=${planId}`, { credentials: 'include' });
            const body = await resp.json();
            if (resp.ok && body.ok) init = body.plan;
            else console.warn('Could not load plan:', body.message);
          } catch (err) {
            console.error('Error fetching plan:', err);
          }
        }
      
        // 2) clear everything & set the plan‐name
        clearGrid();
        planName.value = init.name || '';
        placedUnits = {};
      
        // 3) normalise into an array if it was an object
        const unitsArray = Array.isArray(init.units)
          ? init.units
          : Object.values(init.units);
      
        // 4) for each saved entry in the users saved plan, place the corrsponding unit into the grid
        unitsArray.forEach(u => {
          const { row, col } = u;
          const key = `${row},${col}`;
          const cell = document.querySelector(`.unit-cell[data-key="${key}"]`);
      
          // Build the unitmodel payload 
          const dataForModel = {
            unit_name:  u.unitname,
            unit_code:  u.unitcode,
            semester1:  u.semester1,
            semester2:  u.semester2,
            exam:       u.exam
          };
      
          const uintm  = new UnitModel(dataForModel);
          const div = createUnitDiv(uintm);
      
          cell.innerHTML = '';
          cell.appendChild(div);
          placedUnits[key] = uintm.unit_code;
        });
      
        // 5) rebuild sidebar and validate
        resetAvailableUnits();
        renderUnitList(availableUnits);
        validateAllCells();
      }

    // ───── Prefill template logic ─────
    function setupPrefillHandler() {
        const select = document.getElementById('prefillSelect');
        if (!select) return;
        select.addEventListener('change', () => {
            const key = select.value;
            if (!key) return clearGrid();
            applyTemplate(prefillTemplates[key]);
        });
    }

    function applyTemplate(template) {
        clearGrid();
        template.forEach(({ unit_code, row, col }) => {
            const unit = allUnits.find(u => u.unit_code === unit_code);
            if (!unit) return console.warn(`Unit ${unit_code} not found`);
    
            // Locate cell by data-key!
            const cell = document.querySelector(`.unit-cell[data-key="${row},${col}"]`);
            if (!cell) return;
    
            const div = createUnitDiv(unit);
            cell.innerHTML = "";            // clear cell before adding, in case of remnant
            cell.appendChild(div);
    
            // Remove from available
            availableUnits = availableUnits.filter(u => u.unit_code !== unit_code);
        });
        renderUnitList(availableUnits);
    }

    function clearGrid() {
        dropZones.forEach(zone => {
            // Remove any .unit divs
            const oldUnits = Array.from(zone.querySelectorAll('.unit'));
            oldUnits.forEach(div => div.remove());
        });
        availableUnits = [...allUnits];
        renderUnitList(availableUnits);
    }

    // ───── Fetch all units for the list ─────
    function loadUnits() {
        fetch('/units/recommended')
        .then(res => res.json())
        .then(data => {
            allUnits = data.map(u => new UnitModel(u));
            resetAvailableUnits();
            renderUnitList(availableUnits);
            validateAllCells();
        })
        .catch(() => console.error('Failed to load units'));
    }
    function resetAvailableUnits() {
        const placedCodes = Object.values(placedUnits);
        availableUnits = allUnits.filter(u => !placedCodes.includes(u.unit_code));
    }

    // ───── DOM rendering ─────
    function renderUnitList(units) {
        unitList.innerHTML = '';
        units.forEach(u => {
            let div = createUnitDiv(u);
            div.setAttribute('data-code', u.unit_code);
            unitList.appendChild(div);
        });
        setDragHandlers(unitList);
    }
    function createUnitDiv(unit) {
        const div = document.createElement('div');
        div.className = [   //changed these classes to fill the parent container (cell)
            'unit',               
            'flex', 'flex-col', 
            'justify-center', 'items-stretch', 
            'w-full', 'h-full',
            'p-2', 'rounded-lg', 'border',
            'border-gray-300','dark:border-gray-700', 'cursor-move', 'gap-1',
            'bg-white', 'dark:bg-dark-fg', 'shadow-sm'
          ].join(' ');
        div.setAttribute('data-code', unit.unit_code);
        div.style.minWidth = "0";

        // Name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'flex-grow font-bold text-sm leading-tight w-full';
        nameSpan.textContent = unit.unit_name;
        nameSpan.style.minWidth = "0";
        nameSpan.style.wordBreak = "break-word";
        div.appendChild(nameSpan);

        // tags, I think this looks nice than just listing them
        const tags = document.createElement('div');
        tags.className = 'flex flex-wrap gap-1 items-center mt-0';
        if (unit.semester1) tags.appendChild(tag('Sem 1', 'bg-blue-100 text-blue-800'));
        if (unit.semester2) tags.appendChild(tag('Sem 2', 'bg-green-100 text-green-800'));
        if (unit.exam)      tags.appendChild(tag('Exam',  'bg-red-100 text-red-700'));
        tags.appendChild(tag(unit.unit_code, 'bg-slate-200 text-slate-700'));
        div.appendChild(tags);

        // drag attributes
        div.setAttribute('draggable', 'true');
        div.addEventListener('dragstart', dragStartHandler);
        div.addEventListener('dragend', dragEndHandler);

        return div;
    }
    function tag(text, classes) {
        const span = document.createElement('span');
        span.className = `tag px-1 py-[1.5px] text-[10px] rounded font-semibold inline-block ${classes}`;
        span.textContent = text;
        return span;
    }
    function getPlaceholderHtml() {
        return '<div class="text-gray-300 dark:text-gray-600 italic text-xs text-center">Drop unit here</div>';
    }

    // ───── Drag/drop support ─────
    function setupDragAndDrop() {
        //  allow drop to return unit to list
        unitList.addEventListener('dragover', e => e.preventDefault());
        unitList.addEventListener('drop', e => {
            e.preventDefault();
            const code = e.dataTransfer.getData('text/plain');
            if (!code) return;
            let gridUnit = document.querySelector(`.unit-cell .unit[data-code="${code}"]`);
            if (gridUnit) {
                let cell = gridUnit.closest('.unit-cell');
                gridUnit.remove();
                cell.innerHTML = getPlaceholderHtml();
                delete placedUnits[cell.dataset.key];
            }
            if (!unitList.querySelector(`.unit[data-code="${code}"]`)) {
                const unit = allUnits.find(u => u.unit_code === code);
                if (unit) {
                    const div = createUnitDiv(unit);
                    unitList.appendChild(div);
                }
            }
            resetAvailableUnits();
            validateAllCells();
        });

        // Grid cells
        dropZones.forEach(cell => {
            cell.addEventListener('dragover', e => e.preventDefault());
            cell.addEventListener('drop', function(e) {
                e.preventDefault();
                const code = e.dataTransfer.getData('text/plain');
                if (!code) return;

                // Remove duplicates
                let existing = document.querySelector(`.unit-cell .unit[data-code="${code}"]`);
                if (existing) {
                    let oldCell = existing.closest('.unit-cell');
                    existing.remove();
                    oldCell.innerHTML = getPlaceholderHtml();
                    delete placedUnits[oldCell.dataset.key];
                }

                let fromList = unitList.querySelector(`.unit[data-code="${code}"]`);
                if (fromList) fromList.remove();

                cell.innerHTML = '';
                const unit = allUnits.find(u => u.unit_code === code);
                if (!unit) return;
                const div = createUnitDiv(unit);
                cell.appendChild(div);
                placedUnits[cell.dataset.key] = code;

                resetAvailableUnits();
                renderUnitList(availableUnits); // updates the sidebar
                validateAllCells(); // updates all warnings
            });
        });
    }
    function setDragHandlers(ctx) {
        (ctx || document).querySelectorAll('.unit').forEach(div => {
            div.setAttribute('draggable', 'true');
            div.removeEventListener('dragstart', dragStartHandler);
            div.removeEventListener('dragend', dragEndHandler);
            div.addEventListener('dragstart', dragStartHandler);
            div.addEventListener('dragend', dragEndHandler);
        });
    }
    function dragStartHandler(e) {
        const code = this.getAttribute('data-code');
        e.dataTransfer.setData('text/plain', code);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(()=>this.classList.add('opacity-50'), 0);
    }
    function dragEndHandler() {
        this.classList.remove('opacity-50');
    }

    // ───── Semester-check support ─────
    function validateAllCells() {
        dropZones.forEach(cell => {
            const unitDiv = cell.querySelector('.unit');
            if (unitDiv) {
                const code = unitDiv.getAttribute('data-code');
                const unit = allUnits.find(u => u.unit_code === code);
                if (unit) validateSemesterPlacement(cell, unit);
            } else {
                cell.classList.remove("ring-2", "ring-red-400");
                const prevBadge = cell.querySelector('.semester-warning');
                if (prevBadge) prevBadge.remove();
            }
        });
    }
    function validateSemesterPlacement(cell, unit) {
        const key = cell.dataset.key.split(',');
        const semIdx = parseInt(key[0]);
        // in the jinja template we can know for sure that a key of 1 is semester 1 and a key of 2 is semsester 2
        const targetSemester = (semIdx % 2 === 1) ? 1 : 2;
        const ok = (targetSemester === 1 && unit.semester1) ||
                   (targetSemester === 2 && unit.semester2);

        cell.classList.remove("ring-2", "ring-red-400");
        const prevBadge = cell.querySelector('.semester-warning');
        if (prevBadge) prevBadge.remove();

        if (!ok) {
            cell.classList.add("ring-2", "ring-red-400");
            const unitDiv = cell.querySelector('.unit');
            if (unitDiv) {
                unitDiv.style.position = "relative";
                const badge = document.createElement('div');
                badge.className = "semester-warning absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1 py-0.5 rounded shadow";
                badge.innerText = "Wrong Semester";
                badge.style.zIndex = 20;
                unitDiv.appendChild(badge);
            }
        }
    }

    // ───── Search/filter support ─────
    function setupSearchFilter() {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.trim().toLowerCase();
            let filtered = availableUnits;
            if (q)
                filtered = availableUnits.filter(u =>
                    u.unit_name.toLowerCase().includes(q) || u.unit_code.toLowerCase().includes(q)
                );
            renderUnitList(filtered);
        });
    }

    // ───── Save logic ─────
    function setupSaveHandler() {
        saveButton.addEventListener('click', () => {
            const name = planName.value.trim();
            if (!name) return createAlert('Please enter a plan name.', 'error');
            const units = [];
            for (let cell of dropZones) {
                const div = cell.querySelector('.unit');
                if (!div) continue;
                const code = div.getAttribute('data-code');
                const unit = allUnits.find(u => u.unit_code === code);
                if (unit) {
                    units.push({
                        unit_name: unit.unit_name,
                        unit_code: unit.unit_code,
                        column: +cell.dataset.key.split(',')[1],
                        row: +cell.dataset.key.split(',')[0]
                    });
                }
            }
            if (!units.length) return createAlert('Please place at least one unit.', 'error');

            const placedWithTime = {};
            for (let cell of dropZones) {
                const div = cell.querySelector('.unit');
                if (!div) continue;
                const key = cell.dataset.key;
                const [row, col] = key.split(',').map(Number);
                const timeIndex = (row - 1) * 4 + col; 
                const code = div.getAttribute('data-code');
                placedWithTime[code] = timeIndex;

            }


            // Check each unit's prerequisites
            const unsatisfied = [];

            for (let cell of dropZones) {
                const div = cell.querySelector('.unit');
                if (!div) continue;
                const code = div.getAttribute('data-code');
                const unit = allUnits.find(u => u.unit_code === code);
                if (!unit) {
                    continue;
                }

                if (!unit.prerequisites) {
                    continue;
                }


                const currentTime = placedWithTime[code];

                const groups = unit.prerequisites
                    .split('|')
                    .map(group => group.trim().split('+').map(c => c.trim()));


                const satisfies = groups.some(group =>
                    group.every(prereq => {
                        const prereqTime = placedWithTime[prereq];
                        const status = prereqTime !== undefined && prereqTime < currentTime;
                        return status;
                    })
                );

                if (!satisfies && groups.length > 0 && groups[0][0] !== "") {
                    unsatisfied.push({ unit: code, groups });
                } 
            }

            // Show error if any
            if (unsatisfied.length > 0) {
                let msg = "You are missing prerequisites for the following units:\n\n";
                for (const u of unsatisfied) {
                    msg += `• ${u.unit}\n   requires one of:\n`;
                    u.groups.forEach(g => {
                        msg += `     - ${g.join(' AND ')}\n`;
                    });
                }
                alert(msg);
                return;
            } 

            fetch('/plans/save', {
                method: 'POST',
                headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
                body: JSON.stringify({ plan_name: name, units })
            })
            .then(res => res.json())
            .then(json => {
                createAlert(json.message, json.ok ? 'success' : 'error');
                if (json.ok) setTimeout(()=>location.href='/dashboard', 1000);
            })
            .catch(() => createAlert('An error occurred while saving.', 'error'));
        });

        
        function createAlert(message, category) {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert ${category} fade-out`;
            alertDiv.innerHTML = `
            <span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span>
            ${message}
            `;
            document.querySelector('.absolute-container ul').appendChild(alertDiv);
        }
    }

    // ───── Kickoff ─────
    init();
});