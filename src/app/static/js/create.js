document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('searchInput');
    const saveButton = document.getElementById('saveButton');
    const unitList = document.getElementById('unitList');
    const planName = document.getElementById('planName');
    const dropCells = document.querySelectorAll('.flex-grow > div.border-2');
    let allUnits = [];

    fetch('/all_units')
        .then(response => response.json())
        .then(data => {
            allUnits = data;
            renderUnits(data);
        });

    function renderUnits(units) {
        unitList.innerHTML = '';
        units.forEach(unit => {
            unitList.appendChild(createUnitDiv(`${unit.unit_name} (${unit.unit_code})`));
        });
    }

    function createUnitDiv(text) {
        const div = document.createElement('div');
        div.className = 'p-2 rounded-lg border border-gray-300 mb-2 cursor-move';
        div.textContent = text;
        div.draggable = true;
        div.addEventListener('dragstart', dragStart);
        return div;
    }

    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.textContent);
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('opacity-50');
        e.dataTransfer.setData('fromCell', e.target.closest('.border-2') ? 'true' : 'false');
    }

    dropCells.forEach(cell => {
        cell.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        cell.addEventListener('drop', e => {
            e.preventDefault();
            const text = e.dataTransfer.getData('text/plain');
            const fromCell = e.dataTransfer.getData('fromCell') === 'true';
            if (!text) return;

            if (fromCell) {
                const allDivs = document.querySelectorAll('.flex-grow > div.border-2 > div');
                allDivs.forEach(div => {
                    if (div.textContent === text) div.remove();
                });
            } else {
                const unitDivs = unitList.querySelectorAll('div');
                unitDivs.forEach(div => {
                    if (div.textContent === text) div.remove();
                });
            }

            if (!cell.querySelector('div')) {
                const newDiv = document.createElement('div');
                newDiv.className = 'p-2 rounded text-center cursor-move text-xs unit';
                newDiv.textContent = text;
                newDiv.draggable = true;
                newDiv.addEventListener('dragstart', dragStart);
                cell.appendChild(newDiv);
            }
        });
    });

    unitList.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });



    unitList.addEventListener('drop', e => {
        e.preventDefault();
        const text = e.dataTransfer.getData('text/plain');
        const fromCell = e.dataTransfer.getData('fromCell') === 'true';
        if (text && fromCell) {
            const allDivs = document.querySelectorAll('.flex-grow > div.border-2 > div');
            allDivs.forEach(div => {
                if (div.textContent === text) div.remove();
            });

            unitList.appendChild(createUnitDiv(text));
        }
    });

    input.addEventListener('input', function () {
        const query = input.value.trim().toLowerCase();
        const filtered = allUnits.filter(unit => 
            unit.unit_name.toLowerCase().includes(query) || 
            unit.unit_code.toLowerCase().includes(query)
        );
        renderUnits(filtered);
    });

    saveButton.addEventListener('click', function () {
        const planNameValue = planName.value.trim();
        if (!planNameValue) {
            alert('Please enter a plan name.');
            return;
        }
        const selectedUnits = Array.from(document.querySelectorAll('.unit')).map(div => {
            const text = div.textContent;
            const [unitName, unitCode] = text.split(' (');
            return {
                unit_name: unitName.trim(),
                unit_code: unitCode.replace(')', '').trim(),
                column: Number(div.parentElement.className.match(/col-start-(\d+)/)?.[1])- 1, // Adjust for Year Column 
                row: Number(div.parentElement.className.match(/row-start-(\d+)/)?.[1]) 
            };
        });
        const data = { plan_name: planNameValue, units: selectedUnits };
        fetch('/save_units', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
    });
});