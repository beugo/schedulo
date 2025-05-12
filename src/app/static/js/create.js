class UnitModel {
    constructor({ unit_name, unit_code, semester1, semester2, exam }) {
        this.unit_name = unit_name;
        this.unit_code = unit_code;
        this.semester1 = semester1;
        this.semester2 = semester2;
        this.exam = exam;
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
    let allUnits = [];
    let availableUnits = [];
    let placedUnits = {}; // cell key is unit_code

    // ───── Initialization ─────
    function init() {
        applyInitialPlan();
        loadUnits();
        setupSearchFilter();
        setupSaveHandler();
        setupDragAndDrop();
    }

    // ───── Initial render of grid ─────
    function applyInitialPlan() {
        const init = window.INIT_PLAN || { name: '', units: {} };
        planName.value = init.name || '';
        placedUnits = {};
        dropZones.forEach(cell => {
            cell.innerHTML = getPlaceholderHtml();
            const key = cell.dataset.key;
            if (key && init.units[key]) {
                const um = new UnitModel(init.units[key]);
                const div = createUnitDiv(um);
                cell.innerHTML = '';
                cell.appendChild(div);
                placedUnits[key] = um.unit_code;
            }
        });
        validateAllCells();
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
            'bg-white', 'dark:bg-gray-900', 'shadow-sm'
          ].join(' ');
        div.setAttribute('data-code', unit.unit_code);
        div.style.minWidth = "0";

        // Name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'flex-grow font-bold text-s leading-tight w-full';
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
            if (!name) return alert('Please enter a plan name.');
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
            if (!units.length) return alert('Please place at least one unit.');
            fetch('/plans/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_name: name, units })
            })
            .then(res => res.json())
            .then(json => {
                alert(json.message);
                if (json.ok) setTimeout(()=>location.href='/dashboard', 1000);
            })
            .catch(() => alert("An error occurred while saving."));
        });
    }

    // ───── Kickoff ─────
    init();
});