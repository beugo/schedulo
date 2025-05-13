document.addEventListener('DOMContentLoaded', () => {
    // ─────────────── Constants & State ───────────────
    const input       = document.getElementById('searchInput');
    const saveButton  = document.getElementById('saveButton');
    const unitList    = document.getElementById('unitList');
    const planName    = document.getElementById('planName');
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    const dropZones   = Array
        .from(document.querySelectorAll('.flex-grow > div.border-2'))
        .filter(el => !el.classList.contains('year'));

    let allUnits = [];
    let availableUnits = [];

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

    // ─────────────── Initialization ───────────────
    function init() {
        applyInitialPlan();
        loadUnits();
        setupPrefillHandler();
        setupSearchFilter();
        setupSaveHandler();
        setupGridDragAndDrop();
        setupListDragAndDrop();
    }

    function applyInitialPlan() {
        const init = window.INIT_PLAN || { name: '', units: {} };
        planName.value = init.name;

        Object.entries(init.units).forEach(([key, unit]) => {
        const cell = document.querySelector(`.unit-cell[data-key="${key}"]`);
        if (!cell) return;

        const div = createUnitDiv(`${unit.name} (${unit.code})`, { small: true });
        cell.appendChild(div);
        });
    }

    function loadUnits() {
        fetch('/units/recommended')
        .then(res => res.json())
        .then(data => {
            allUnits = data;
            availableUnits = [...data];
            renderUnits(availableUnits);
        })
        .catch(() => console.error('Failed to load units'));
    }

    // ─────────────── Unit Plan Prefillers ───────────────
    function setupPrefillHandler() {
        const select = document.getElementById('prefillSelect');
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
            const text = `${unit.unit_name} (${unit.unit_code})`;

            const cell = document.querySelector(`.unit-cell[data-key="${row},${col}"]`);
            if (!cell) return;

            const div = createUnitDiv(text, { small: true });
            cell.appendChild(div);

            availableUnits = availableUnits.filter(u => u.unit_code !== unit_code);
        });
        renderUnits(availableUnits);
    }

    // ─────────────── Rendering Helpers ───────────────
    function renderUnits(units) {
        unitList.innerHTML = '';
        units.forEach(u => {
        const text = `${u.unit_name} (${u.unit_code})`;
        unitList.appendChild(createUnitDiv(text));
        });
    }

    function createUnitDiv(text, { small = false } = {}) {
        const div = document.createElement('div');
        div.className = [
        'p-2',
        small ? 'text-xs rounded text-center' : 'rounded-lg border border-gray-300 mb-2 cursor-move',
        'unit'
        ].join(' ');
        div.textContent = text;
        div.draggable = true;
        div.addEventListener('dragstart', onDragStart);
        return div;
    }

    function clearGrid() {
        dropZones.forEach(zone => {
            const old = zone.querySelector('div');
            if (!old) return;
            const text = old.textContent;
            unitList.appendChild(createUnitDiv(text));
            old.remove();
        });
        availableUnits = [...allUnits];
        renderUnits(availableUnits);
    }

    // ─────────────── Drag & Drop ───────────────
    function onDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.textContent);
        e.dataTransfer.setData('fromCell', !!e.target.closest('.border-2'));
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('opacity-50');
    }

    function setupGridDragAndDrop() {
        dropZones.forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        zone.addEventListener('drop', onGridDrop);
        });
    }

    function onGridDrop(e) {
        e.preventDefault();
        const text     = e.dataTransfer.getData('text/plain');
        const fromCell = e.dataTransfer.getData('fromCell') === 'true';
        if (!text) return;

        const cell = e.currentTarget;
        removeExistingInCell(cell);
        removeSourceDiv(text, fromCell);

        const newDiv = createUnitDiv(text, { small: true });
        cell.appendChild(newDiv);

        const code = text.match(/\(([^)]+)\)$/)[1];
        availableUnits = availableUnits.filter(u => u.unit_code !== code);
    }

    function removeExistingInCell(cell) {
        const old = cell.querySelector('div');
        if (!old) return;
        const text = old.textContent;
        unitList.appendChild(createUnitDiv(text));
        const code = text.match(/\(([^)]+)\)$/)[1];
        availableUnits.push({
        unit_name: text.split(' (')[0],
        unit_code: code
        });
        old.remove();
    }

    function removeSourceDiv(text, fromCell) {
        const selector = fromCell
        ? '.flex-grow > div.border-2 > div'
        : '#unitList > div';
        document.querySelectorAll(selector).forEach(div => {
        if (div.textContent === text) div.remove();
        });
    }

    function setupListDragAndDrop() {
        unitList.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        });
        unitList.addEventListener('drop', e => {
        e.preventDefault();
        const text     = e.dataTransfer.getData('text/plain');
        const fromCell = e.dataTransfer.getData('fromCell') === 'true';
        if (!text || !fromCell) return;
        removeSourceDiv(text, true);
        unitList.appendChild(createUnitDiv(text));
        const code = text.match(/\(([^)]+)\)$/)[1];
        availableUnits.push({
            unit_name: text.split(' (')[0],
            unit_code: code
        });
        });
    }

    // ─────────────── Search & Filter ───────────────
    function setupSearchFilter() {
        input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        const filtered = availableUnits.filter(u =>
            u.unit_name.toLowerCase().includes(q) ||
            u.unit_code.toLowerCase().includes(q)
        );
        renderUnits(filtered);
        });
    }

    // ─────────────── Save Handler ───────────────
    function setupSaveHandler() {
        saveButton.addEventListener('click', () => {
        const name = planName.value.trim();
        if (!name) {
            alert('Please enter a plan name.');
            return;
        }

        const units = Array.from(document.querySelectorAll('.unit.text-xs')).map(div => {
            const [unitName, code] = div.textContent.split(' (');
            const colMatch = div.parentElement.className.match(/col-start-(\d+)/);
            const rowMatch = div.parentElement.className.match(/row-start-(\d+)/);
            return {
            unit_name: unitName.trim(),
            unit_code: code.replace(')', '').trim(),
            column: Number(colMatch?.[1] || 1) - 1,
            row: Number(rowMatch?.[1] || 1)
            };
        });

        if (units.length === 0) {
            alert('Please place at least one unit.');
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
            if (json.ok) {
                setTimeout(() => { window.location.href = '/dashboard'; }, 2500);
            }
            })
            .catch(() => createAlert('An error occurred while saving the plan.', 'error'));
        });
    }

    function createAlert(message, category) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${category} fade-out`;
        alertDiv.innerHTML = `
        <span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span>
        ${message}
        `;
        document.querySelector('.absolute-container ul').appendChild(alertDiv);
    }

    // ─────────────── Kickoff ───────────────
    init();
});
