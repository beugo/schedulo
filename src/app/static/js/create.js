document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById("searchInput");
    const saveBtn = document.getElementById("saveButton");
    const unitList = document.getElementById("unitList");
    const planName = document.getElementById("planName");
    const dropCells = Array.from(
      document.querySelectorAll(".flex-grow > div.border-2")
    ).filter(c => !c.classList.contains("year"));
  
    let allUnits = [], availableUnits = [];
  
    // Load recommended units
    fetch("/units/recommended")
      .then(res => res.json())
      .then(data => {
        allUnits = availableUnits = data;
        renderUnits(availableUnits);
      });
  
    // Render unit list with filtering and sorting
    function renderUnits(units) {
      const q = input.value.trim().toLowerCase();
      unitList.innerHTML = "";
      units
        .sort((a, b) => (b.value - a.value) || (a.id - b.id))
        .filter(u =>
          u.unit_name.toLowerCase().includes(q) ||
          u.unit_code.toLowerCase().includes(q)
        )
        .forEach(u =>
          unitList.appendChild(
            createUnitDiv(u.unit_name + " (" + u.unit_code + ")")
          )
        );
    }
  
    // Create a draggable unit element
    function createUnitDiv(text) {
      const div = document.createElement("div");
      div.className =
        "p-2 rounded-lg border border-gray-300 mb-2 cursor-move";
      div.textContent = text;
      div.draggable = true;
      div.addEventListener("dragstart", dragStart);
      return div;
    }
  
    // Handle drag start
    function dragStart(e) {
      e.dataTransfer.setData("text/plain", e.target.textContent);
      e.dataTransfer.setData(
        "fromCell",
        !!e.target.closest(".border-2")
      );
      e.dataTransfer.effectAllowed = "move";
      e.target.classList.add("opacity-50");
    }
  
    // Common dragover behavior
    const onDragOver = e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };
  
    // Remove a unit from grid or list
    function removeUnit(text, fromCell) {
      if (fromCell) {
        document
          .querySelectorAll(".flex-grow > div.border-2 > div")
          .forEach(div => {
            if (div.textContent === text) div.remove();
          });
      } else {
        Array.from(unitList.children).forEach(div => {
          if (div.textContent === text) div.remove();
        });
      }
    }
  
    // Handle dropping onto a grid cell
    function onCellDrop(e) {
      e.preventDefault();
      const text = e.dataTransfer.getData("text/plain");
      const fromCell =
        e.dataTransfer.getData("fromCell") === "true";
      if (!text) return;
  
      // If cell occupied, move existing back to list
      const existing = this.querySelector("div");
      if (existing) {
        const parts = existing.textContent.split(" (");
        existing.remove();
        const unit = allUnits.find(
          u => u.unit_code === parts[1].slice(0, -1)
        );
        availableUnits.push(unit);
        unitList.appendChild(
          createUnitDiv(unit.unit_name + " (" + unit.unit_code + ")")
        );
      }
  
      removeUnit(text, fromCell);
  
      const newDiv = document.createElement("div");
      newDiv.className =
        "p-2 rounded text-center cursor-move text-xs unit";
      newDiv.textContent = text;
      newDiv.draggable = true;
      newDiv.addEventListener("dragstart", dragStart);
      this.appendChild(newDiv);
  
      // Update available units
      const code = text.split("(")[1].slice(0, -1);
      availableUnits = availableUnits.filter(u => u.unit_code !== code);
      renderUnits(availableUnits);
    }
  
    // Attach cell drag/drop events
    dropCells.forEach(cell => {
      cell.addEventListener("dragover", onDragOver);
      cell.addEventListener("drop", onCellDrop);
    });
  
    // Handle dragging back to unit list
    unitList.addEventListener("dragover", onDragOver);
    unitList.addEventListener("drop", e => {
      e.preventDefault();
      const text = e.dataTransfer.getData("text/plain");
      const fromCell =
        e.dataTransfer.getData("fromCell") === "true";
      if (!text || !fromCell) return;
      removeUnit(text, true);
      unitList.appendChild(createUnitDiv(text));
      const unit = allUnits.find(
        u => u.unit_code === text.split("(")[1].slice(0, -1)
      );
      availableUnits.push(unit);
      renderUnits(availableUnits);
    });
  
    // Live filtering
    input.addEventListener("input", () => renderUnits(availableUnits));
  
    // Save plan
    saveBtn.addEventListener("click", () => {
      const name = planName.value.trim();
      if (!name) return alert("Please enter a plan name.");
      const units = Array.from(
        document.querySelectorAll(".unit")
      ).map(div => {
        const parts = div.textContent.split(" (");
        const col =
          parseInt(
            div.parentElement.className.match(/col-start-(\d+)/)[1]
          ) - 1;
        const row =
          parseInt(
            div.parentElement.className.match(/row-start-(\d+)/)[1]
          );
        return {
          unit_name: parts[0].trim(),
          unit_code: parts[1].slice(0, -1).trim(),
          column: col,
          row: row
        };
      });
      fetch("/plans/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_name: name, units: units })
      })
        .then(res => res.json())
        .then(data => {
          if (data.message)
            createAlert(
              data.message,
              data.ok ? "success" : "error"
            );
        })
        .catch(() =>
          createAlert(
            "An error occurred while saving the plan.",
            "error"
          )
        );
    });
  
    // Alert helper
    function createAlert(message, category) {
      const alertDiv = document.createElement("div");
      alertDiv.className = `alert ${category} fade-out`;
      alertDiv.innerHTML =
        '<span class="closebtn" onclick="this.parentElement.style.display=\'none\';">&times;</span>' +
        message;
      document
        .querySelector(".absolute-container ul")
        .appendChild(alertDiv);
    }
  });
  