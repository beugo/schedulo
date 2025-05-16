const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

document.addEventListener("DOMContentLoaded", function() {
  const input = document.getElementById('searchInput');
  const tbody = document.getElementById('unitTableBody');

  let allUnits = [];

  function renderTable(units) {
    tbody.innerHTML = "";
    units.forEach(unit => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-100 dark:hover:bg-dark-secondary";
      tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${unit.id}</td>
                <td class="px-6 py-4 whitespace-nowrap">${unit.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${unit.is_deleted ? 'Deleted' : 'Active'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${!unit.shared ? `<a onclick="post_share(${unit.id})" class="text-green-600 hover:text-green-900">Share</a>` : ""}
                    <a href="/plans/view?id=${unit.id}" class="text-blue-600 hover:text-blue-900 ml-2">View</a>
                    <a href="/create?id=${unit.id}" class="text-blue-600 hover:text-blue-900 ml-2">Edit</a>
                    <a onclick="post_delete(${unit.id})" class="text-red-600 hover:text-red-900 ml-2 cursor-pointer">Delete</a>
                </td>
            `;
      tbody.appendChild(tr);
    });
  }

  fetch("/plans/user")
    .then(response => response.json())
    .then(data => {
      allUnits = data;
      renderTable(allUnits);
    });

  input.addEventListener('input', function() {
    const query = input.value.trim().toLowerCase();
    const filtered = allUnits.filter(unit => unit.name.toLowerCase().includes(query));
    renderTable(filtered);
  });
});

function post_share(id) {
  fetch(`/share/post?id=${encodeURIComponent(id)}`, {
    method: 'POST',
    body: JSON.stringify({ id: id }),
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken
    }
  }).then(response => {
    response.json().then(res => {
      if (res.ok) {
        createAlert(res.message, 'success');
      } else {
        createAlert(res.message, 'error');
      }
    })
  })
}
function post_delete(id) {
  if (confirm("Are you sure you want to delete this plan? This action cannot be undone")) {
    fetch(`/plans/delete?id=${encodeURIComponent(id)}`, {
      method: 'POST',
      body: JSON.stringify({ id: id }),
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      }
    }).then(response => {
      response.json().then(res => {
        if (res.ok) {
          createAlert(res.message, 'success');
        } else {
          createAlert(res.message, 'error');
        }
      })
      location.reload();
    })
  }
}

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
