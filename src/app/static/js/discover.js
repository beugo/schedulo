document.addEventListener("DOMContentLoaded", function() {
  const input = document.getElementById('searchInput');
  const unitList = document.getElementById('unitList');
  let allUnits = [];

  function renderTable(units) {
    unitList.innerHTML = "";
    units.forEach(unit => {
      const div = document.createElement("div");
      div.id = "unit"
      div.className = "p-4 mb-4 rounded-2xl bg-white transition bg-white dark:bg-dark-fg border-2 dark:border-dark-border shadow ext-gray-600 dark:text-dark-secondary cursor-pointer";
      div.onclick = () => {
        window.location.href = `discover?id=${unit.id}`;
      }
      div.innerHTML = `
        <a target="_blank" class="text-xl font-semibold text-blue-600">
          ${unit.unit_code}: ${unit.unit_name}
        </a>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">${unit.description}</p>
        <p class="mt-2 text-sm"><strong>Coordinator:</strong> ${unit.unit_coordinator}</p>
        <p class="text-sm"><strong>Prerequisites:</strong> ${unit.prerequisites}</p>
        <div class="text-sm mt-2">
          <strong>Contact Hours:</strong>
          <ul class="list-disc list-inside mt-1">
            ${JSON.parse(unit.contact_hours).map(([type, hours]) => `<li>${type}: ${hours}</li>`).join("")}
          </ul>
        </div>
      `;
      unitList.appendChild(div);
    });
  }

  fetch("/units/all")
    .then(response => response.json())
    .then(data => {
      allUnits = data;
      renderTable(allUnits);
    });

  input.addEventListener('input', function() {
    const query = input.value.trim().toLowerCase();
    const filtered = allUnits.filter(unit => unit.unit_name.toLowerCase().includes(query));
    renderTable(filtered);
  });
});
