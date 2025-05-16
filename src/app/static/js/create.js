const CONFIG = {
  selectors: {
    searchInput: '#searchInput',
    saveButton: '#saveButton',
    unitList: '#unitList',
    planName: '#planName',
    prefillSelect: '#prefillSelect',
    csCoreSelectWrapper: '#csCoreSelectWrapper',
    csCoreSelect: '#csCoreSelect'
  },
  endpoints: {
    recommendedUnits: '/units/recommended',
    getPlan: '/plans/get',
    savePlan: '/plans/save'
  },
  templates: {
    prefillTemplates: {
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
        { unit_code: 'CITS3006', row: 6, col: 2 }
      ],
      data_science: [
        { unit_code: 'CITS1401', row: 1, col: 1 },
        { unit_code: 'PHIL1001', row: 1, col: 2 },
        { unit_code: 'CITS1402', row: 2, col: 1 },
        { unit_code: 'STAT1400', row: 2, col: 2 },
        { unit_code: 'STAT2401', row: 3, col: 1 },
        { unit_code: 'STAT2402', row: 4, col: 1 },
        { unit_code: 'CITS2402', row: 4, col: 2 },
        { unit_code: 'CITS3403', row: 5, col: 1 },
        { unit_code: 'CITS3401', row: 5, col: 2 },
        { unit_code: 'CITS3200', row: 6, col: 1 },
        { unit_code: 'STAT3064', row: 6, col: 2 },
        { unit_code: 'STAT3405', row: 6, col: 3 }
      ]
    },
    csFinalCoreOptions: [
      { code: "CITS3003", name: "Graphics and Animation", semester: 1 },
      { code: "CITS3007", name: "Secure Coding", semester: 1 },
      { code: "CITS3009", name: "WIL Internship", semester: 1 },
      { code: "CITS3005", name: "Knowledge Representation", semester: 2 },
      { code: "CITS3011", name: "Intelligent Agents", semester: 2 },
      { code: "CITS3402", name: "High Performance Computing", semester: 2 }
    ]
  }
};

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

// — constants —
const { selectors, endpoints, templates } = CONFIG;

const DOM = Object.fromEntries(
  Object.entries(selectors).map(([key, sel]) => [key, document.querySelector(sel)])
);

const CELL_SELECTOR = '.unit-cell';
const DROP_ZONES = Array.from(document.querySelectorAll(CELL_SELECTOR));
const CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]').content;

// — state —
let allUnits = [];
let availableUnits = [];
let placedUnits = {}; // { 'row,col': 'CITS1401', ... }

// — init —
(function init() {
  applyInitialPlan();
  loadUnits();
  setupPrefillHandler();
  setupSearchFilter();
  setupSaveHandler();
  setupDragAndDrop();
})();

// — helpers —
function byCode(code) {
  return allUnits.find(u => u.unit_code === code);
}

const keyOf = cell => cell?.dataset.key || '';

function createUnitDiv(unit) {
  const div = document.createElement('div');
  div.className = [
    'unit', 'flex', 'flex-col', 'justify-center', 'items-stretch',
    'w-full', 'h-full', 'p-2', 'rounded-lg', 'border',
    'border-gray-300', 'dark:border-gray-700', 'cursor-move', 'gap-1',
    'bg-white', 'dark:bg-dark-fg', 'shadow-sm'
  ].join(' ');
  div.dataset.code = unit.unit_code;
  div.style.minWidth = '0';

  const name = document.createElement('span');
  name.className = 'flex-grow font-bold text-sm leading-tight w-full';
  name.textContent = unit.unit_name;
  name.style.minWidth = '0';
  name.style.wordBreak = 'break-word';
  div.appendChild(name);

  const tags = document.createElement('div');
  tags.className = 'flex flex-wrap gap-1 items-center';
  if (unit.semester1) tags.appendChild(tag('Sem 1', 'bg-blue-100 text-blue-800'));
  if (unit.semester2) tags.appendChild(tag('Sem 2', 'bg-green-100 text-green-800'));
  if (unit.exam)      tags.appendChild(tag('Exam',  'bg-red-100 text-red-700'));
  tags.appendChild(tag(unit.unit_code, 'bg-slate-200 text-slate-700'));
  div.appendChild(tags);

  div.draggable = true;
  div.addEventListener('dragstart', dragStartHandler);
  div.addEventListener('dragend',   dragEndHandler);
  return div;
}

function tag(text, cls) {
  const span = document.createElement('span');
  span.className = `tag px-1 py-[1.5px] text-[10px] rounded font-semibold ${cls}`;
  span.textContent = text;
  return span;
}

function placeholderHtml() {
  return '<div class="text-gray-300 dark:text-gray-600 italic text-xs text-center">Drop unit here</div>';
}

function resetAvailableUnits() {
  const placedCodes = Object.values(placedUnits);
  availableUnits = allUnits.filter(u => !placedCodes.includes(u.unit_code));
}

// — prerequisite utility —
function checkPrerequisites(unit, placedWithTime) {
  if (!unit?.prerequisites) return { ok: true };

  const currentTime = placedWithTime[unit.unit_code];
  if (currentTime === undefined) return { ok: true };

  const groups = unit.prerequisites
    .split('|')
    .map(g => g.trim().split('+').map(c => c.trim()));

  const ok = groups.some(group =>
    group.every(pr => placedWithTime[pr] !== undefined && placedWithTime[pr] < currentTime)
  );

  const tooltip = groups.map(g => g.join(' AND ')).join(' OR ');
  return { ok, tooltip, groups };
}

// — data loading —
function loadUnits() {
  fetch(endpoints.recommendedUnits)
    .then(res => res.json())
    .then(data => {
      allUnits = data.map(u => new UnitModel(u));
      resetAvailableUnits();
      renderUnitList(availableUnits);
      validateAllCells();
    })
    .catch(() => console.error('Failed to load units'));
}

// — grid/plan initialisation —
async function applyInitialPlan() {
  let init = { name: '', units: [] };
  const planId = new URLSearchParams(location.search).get('id');
  if (planId) {
    try {
      const res  = await fetch(`${endpoints.getPlan}?id=${planId}`, { credentials: 'include' });
      const body = await res.json();
      if (res.ok && body.ok) init = body.plan;
      else console.warn('Could not load plan:', body.message);
    } catch (e) { console.error('Error fetching plan:', e); }
  }

  clearGrid();
  DOM.planName.value = init.name || '';
  placedUnits = {};

  (Array.isArray(init.units) ? init.units : Object.values(init.units)).forEach(u => {
    const key  = `${u.row},${u.col}`;
    const cell = document.querySelector(`${CELL_SELECTOR}[data-key="${key}"]`);
    if (!cell) return;

    const unitModel = new UnitModel({
      unit_name: u.unitname,
      unit_code: u.unitcode,
      semester1: u.semester1,
      semester2: u.semester2,
      exam:      u.exam,
      prerequisites: u.prerequisites
    });
    cell.innerHTML = '';
    cell.appendChild(createUnitDiv(unitModel));
    placedUnits[key] = unitModel.unit_code;
  });

  resetAvailableUnits();
  renderUnitList(availableUnits);
  validateAllCells();
}

function clearGrid() {
  DROP_ZONES.forEach(z => z.innerHTML = placeholderHtml());
  availableUnits = [...allUnits];
  renderUnitList(availableUnits);
}

// — UI rendering —
function renderUnitList(units) {
  DOM.unitList.innerHTML = '';
  units.forEach(u => DOM.unitList.appendChild(createUnitDiv(u)));
  setDragHandlers(DOM.unitList);
}

// — prefill templates —
function setupPrefillHandler() {
  const select            = DOM.prefillSelect;
  const coreSelectWrapper = DOM.csCoreSelectWrapper;
  const coreSelect        = DOM.csCoreSelect;
  if (!select) return;

  select.addEventListener('change', () => {
    const key = select.value;
    clearGrid();

    if (key === 'cs') {
      applyTemplate(templates.prefillTemplates.cs);
      coreSelectWrapper.classList.remove('hidden');
      coreSelect.innerHTML = '<option value="">— Select one —</option>';
      templates.csFinalCoreOptions.forEach(u => {
        const o = document.createElement('option');
        o.value = u.code;
        o.textContent = `${u.code} – ${u.name} (Sem ${u.semester})`;
        coreSelect.appendChild(o);
      });
    } else {
      applyTemplate(templates.prefillTemplates[key] || []);
      coreSelectWrapper.classList.add('hidden');
      coreSelect.innerHTML = '';
    }
  });

  coreSelect.addEventListener('change', () => {
    const code = coreSelect.value;
    const u    = templates.csFinalCoreOptions.find(x => x.code === code);
    if (!u) return;

    const row = u.semester === 1 ? 5 : 6;
    const col = 3;
    const key = `${row},${col}`;
    const cell = document.querySelector(`${CELL_SELECTOR}[data-key="${key}"]`);
    if (!cell) return;

    cell.innerHTML = '';
    const unit = byCode(code);
    if (unit) {
      cell.appendChild(createUnitDiv(unit));
      placedUnits[key] = code;
    }

    resetAvailableUnits();
    renderUnitList(availableUnits);
    validateAllCells();
  });
}

function applyTemplate(template) {
  clearGrid();
  template.forEach(({ unit_code, row, col }) => {
    const unit = byCode(unit_code);
    if (!unit) return;
    const cell = document.querySelector(`${CELL_SELECTOR}[data-key="${row},${col}"]`);
    if (!cell) return;
    cell.innerHTML = '';
    cell.appendChild(createUnitDiv(unit));
    availableUnits = availableUnits.filter(u => u.unit_code !== unit_code);
  });
  renderUnitList(availableUnits);
}

// — drag & drop —
function dragStartHandler(e) {
  e.dataTransfer.setData('text/plain', this.dataset.code);
  e.dataTransfer.setData('sourceKey', this.closest(CELL_SELECTOR)?.dataset.key || '');
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => this.classList.add('opacity-50'));
}
function dragEndHandler() {
  this.classList.remove('opacity-50');
}
function setDragHandlers(ctx = document) {
  ctx.querySelectorAll('.unit').forEach(div => {
    div.draggable = true;
    div.removeEventListener('dragstart', dragStartHandler);
    div.removeEventListener('dragend',   dragEndHandler);
    div.addEventListener('dragstart', dragStartHandler);
    div.addEventListener('dragend',   dragEndHandler);
  });
}
function setupDragAndDrop() {
  // list -> return to list
  DOM.unitList.addEventListener('dragover', e => e.preventDefault());
  DOM.unitList.addEventListener('drop', e => {
    e.preventDefault();
    const code = e.dataTransfer.getData('text/plain');
    if (!code) return;

    const gridUnit = document.querySelector(`${CELL_SELECTOR} .unit[data-code="${code}"]`);
    if (gridUnit) {
      const cell = gridUnit.closest(CELL_SELECTOR);
      gridUnit.remove();
      cell.innerHTML = placeholderHtml();
      delete placedUnits[cell.dataset.key];
    }
    if (!DOM.unitList.querySelector(`.unit[data-code="${code}"]`)) {
      const unit = byCode(code);
      if (unit) DOM.unitList.appendChild(createUnitDiv(unit));
    }
    resetAvailableUnits();
    validateAllCells();
  });

  // grid cells
  DROP_ZONES.forEach(cell => {
    cell.addEventListener('dragover', e => e.preventDefault());
    cell.addEventListener('drop', e => {
      e.preventDefault();
      const code = e.dataTransfer.getData('text/plain');
      const sourceKey = e.dataTransfer.getData('sourceKey');
      if (!code) return;

      if (keyOf(cell) === sourceKey) return;
      
      const existingDiv = cell.querySelector('.unit');
      const targetKey = keyOf(cell);

      const draggedUnit = sourceKey
        ? document.querySelector(`${CELL_SELECTOR}[data-key="${sourceKey}"] .unit[data-code="${code}"]`)
        : null;
      if (draggedUnit) {
        draggedUnit.remove();
        document.querySelector(`${CELL_SELECTOR}[data-key="${sourceKey}"]`).innerHTML = placeholderHtml();
      }

      cell.innerHTML = '';
      cell.appendChild(draggedUnit || createUnitDiv(byCode(code)));
      placedUnits[targetKey] = code;

      // if the target was occupied, move that unit back to source cell (swap)
      if (existingDiv && sourceKey) {
        const srcCell = document.querySelector(`${CELL_SELECTOR}[data-key="${sourceKey}"]`);
        srcCell.innerHTML = '';
        srcCell.appendChild(existingDiv);
        placedUnits[sourceKey] = existingDiv.dataset.code;
      } else if (existingDiv) {
        DOM.unitList.appendChild(existingDiv);
      }

      resetAvailableUnits();
      renderUnitList(availableUnits);
      validateAllCells();
    });
  });
}

// — validation —
function validateAllCells() {
  DROP_ZONES.forEach(cell => {
    const unitDiv = cell.querySelector('.unit');
    if (!unitDiv) {
      cell.classList.remove('ring-2', 'ring-red-400');
      cell.querySelector('.semester-warning')?.remove();
      return;
    }
    const unit = byCode(unitDiv.dataset.code);
    if (!unit) return;
    validateSemesterPlacement(cell, unit);
  });
  validatePrereqs();
}

function validateSemesterPlacement(cell, unit) {
  const [row] = cell.dataset.key.split(',').map(Number);
  const targetSemester = (row % 2 === 1) ? 1 : 2;
  const ok = (targetSemester === 1 && unit.semester1) || (targetSemester === 2 && unit.semester2);

  cell.classList.remove('ring-2', 'ring-red-400');
  cell.querySelector('.semester-warning')?.remove();

  if (!ok) {
    cell.classList.add('ring-2', 'ring-red-400');
    const badge = document.createElement('div');
    badge.className = 'semester-warning absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1 rounded shadow';
    badge.textContent = 'Wrong Semester';
    badge.style.zIndex = 20;
    cell.querySelector('.unit').style.position = 'relative';
    cell.querySelector('.unit').appendChild(badge);
  }
}

function validatePrereqs() {
  const placedWithTime = {};
  DROP_ZONES.forEach(cell => {
    const div = cell.querySelector('.unit');
    if (!div) return;
    const [row, col] = cell.dataset.key.split(',').map(Number);
    placedWithTime[div.dataset.code] = (row - 1) * 4 + col;
  });

  DROP_ZONES.forEach(cell => {
    const div = cell.querySelector('.unit');
    if (!div) return;
    const unit = byCode(div.dataset.code);
    const { ok, tooltip } = checkPrerequisites(unit, placedWithTime);

    cell.classList.remove('ring-2', 'ring-red-400');
    cell.querySelector('.prereq-warning')?.remove();

    if (!ok) {
      cell.classList.add('ring-2', 'ring-red-400');
      const badge = document.createElement('div');
      badge.className = 'prereq-warning absolute top-1 left-1 text-[10px] bg-red-500 text-white px-1 rounded';
      badge.textContent = 'PREREQ!';
      badge.style.zIndex = 20;
      div.style.position = 'relative';
      div.title = `Requires: ${tooltip}`;
      div.appendChild(badge);
    }
  });
}

// — search —
function setupSearchFilter() {
  DOM.searchInput.addEventListener('input', () => {
    const q = DOM.searchInput.value.trim().toLowerCase();
    const filtered = q ? availableUnits.filter(u =>
      u.unit_name.toLowerCase().includes(q) || u.unit_code.toLowerCase().includes(q)
    ) : availableUnits;
    renderUnitList(filtered);
  });
}

// — save —
function setupSaveHandler() {
  DOM.saveButton.addEventListener('click', () => {
    const name = DOM.planName.value.trim();
    if (!name) return createAlert('Please enter a plan name.', 'error');

    const major = DOM.prefillSelect.value;
    if (major === 'cs' && !DOM.csCoreSelect.value)
      return createAlert('Please select your final core unit before saving.', 'error');

    const units = [];
    DROP_ZONES.forEach(cell => {
      const div = cell.querySelector('.unit');
      if (!div) return;
      units.push({
        unit_name: byCode(div.dataset.code).unit_name,
        unit_code: div.dataset.code,
        column: +cell.dataset.key.split(',')[1],
        row:    +cell.dataset.key.split(',')[0]
      });
    });
    if (!units.length) return createAlert('Please place at least one unit.', 'error');

    // prereq check before save
    const placedWithTime = {};
    DROP_ZONES.forEach(cell => {
      const div = cell.querySelector('.unit');
      if (!div) return;
      const [r, c] = cell.dataset.key.split(',').map(Number);
      placedWithTime[div.dataset.code] = (r - 1) * 4 + c;
    });

    const unsatisfied = units.filter(u => !checkPrerequisites(byCode(u.unit_code), placedWithTime).ok);
    if (unsatisfied.length) return createAlert('Please make sure all units have their prerequisites satisfied.', 'error');

    fetch(endpoints.savePlan, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': CSRF_TOKEN
      },
      body: JSON.stringify({ plan_name: name, units, plan_id: edit_plan_id })
    })
      .then(r => r.json())
      .then(j => {
        createAlert(j.message, j.ok ? 'success' : 'error');
        if (j.ok) setTimeout(() => (location.href = '/dashboard'), 1000);
      })
      .catch(() => createAlert('An error occurred while saving.', 'error'));
  });

  function createAlert(message, category) {
      const map = {
        success: {
          bar: 'bg-green-300 dark:bg-green-800',
          bg: 'bg-green-50 dark:bg-gray-800',
          text: 'text-green-800 dark:text-green-400',
          icon: '<path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z"/>'
        },
        error: {
          bar: 'bg-red-300 dark:bg-red-800',
          bg: 'bg-red-50 dark:bg-gray-800',
          text: 'text-red-800 dark:text-red-400',
          icon: '<path fill-rule="evenodd" d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" clip-rule="evenodd"/>'
        }
      };
    
      const cfg = map[category]
    
      const container = document.getElementById('flash-container');
      if (!container) return;
    
      const nextId = container.querySelectorAll('[data-flash-id]').length + 1;
    
      const alert = document.createElement('div');
      alert.setAttribute('id', `flash-${nextId}`);
      alert.setAttribute('data-flash-id', nextId);
      alert.setAttribute('role', 'alert');
      alert.className = `
        relative overflow-hidden flex items-center p-4 mb-4 text-sm font-medium
        ${cfg.text} ${cfg.bg} animate-flash-in
      `
    
      //same html as in base.html
      alert.innerHTML = `
        <div class="absolute top-0 left-0 h-1 ${cfg.bar}"
              style="animation: progress-bar 5s linear forwards;"></div>
    
        <svg class="shrink-0 w-4 h-4" aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          ${cfg.icon}
        </svg>
    
        <div class="ms-3">${message}</div>
    
        <button type="button"
          class="ms-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-offset-2 p-1.5
                  inline-flex items-center justify-center h-8 w-8"
          data-flash-close="${nextId}">
          <svg class="w-3 h-3"
                xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 14 14">
              <path stroke="currentColor" stroke-linecap="round"
                    stroke-linejoin="round" stroke-width="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
          </svg>
        </button>
      `.trim();
    
      container.appendChild(alert);
    
      // auto dismiss(the dismiss function is defined in alert.js)
      container.querySelectorAll('[data-flash-id]').forEach(el => {
          setTimeout(() => dismiss(el), 5000);
        });
  }
}
