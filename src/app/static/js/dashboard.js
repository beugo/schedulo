let tbody;
let plansTable;
let friends = [];
let plans = [];
let posts = [];
let input;
let debounceTimer;

document.addEventListener("DOMContentLoaded", function() {
  tbody = document.getElementById('friendTable');
  plansTable = document.getElementById('plansTable');
  input = document.getElementById('searchInput');

  refreshTable();
  refreshPlansTable();
  refreshPosts();

});

function renderFriendsTable(friends) {
  tbody.innerHTML = "";
  friends.forEach(friend => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-100 dark:hover:bg-dark-secondary";
    tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${friend.username}</td>
        `;
    tbody.appendChild(tr);
  });
}

function renderPlansTable(plans) {
  plansTable.innerHTML = "";
  plans.forEach(plan => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-100 dark:hover:bg-dark-secondary cursor-pointer";
    tr.onclick = () => {
      window.location.href = `/plans/view?id=${plan.id}`;
    };
    tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${plan.name}</td>
        `;
    plansTable.appendChild(tr);
  });
}

function renderPosts(posts) {
  const feed = document.getElementById("postFeed");
  feed.innerHTML = "";

  if (!posts.length) {
    const emptyCard = document.createElement("div");
    emptyCard.className = "w-full bg-white dark:bg-dark-fg border border-gray-200 dark:border-dark-border rounded-lg p-4 shadow text-center text-gray-600 dark:text-gray-400";
    emptyCard.innerHTML = `
      <span class="text-sm font-semibold">Feed Empty</span>
      <p>Your friend feed is empty for now.</p>
      <p class="text-xs">When friends share unit plans, they'll appear here!</p>
    `;
    feed.appendChild(emptyCard);
    return;
  }
  // Made this a loop to reduce some of the lines of code
  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "bg-white dark:bg-dark-fg border border-gray-200 dark:border-dark-fg rounded-lg p-4 shadow-sm hover:shadow cursor-pointer flex flex-col gap-2";
    card.onclick = () => window.location.href = `/plans/view?id=${post.unit_plan.unitplanid}`;

    // title
    const header = document.createElement("div");
    header.className = "flex items-center justify-between text-sm";
    header.innerHTML = `
      <strong class="text-base truncate">${post.unit_plan.name}</strong>
      <span class="text-xs text-gray-500 dark:text-gray-400">${post.user_name} • ${new Date(post.posted_at).toLocaleDateString()}</span>
    `;
    card.appendChild(header);

    // unit grid, man i wish this was in typescript
    const grid = document.createElement("div");
    grid.className = "grid grid-cols-4 grid-rows-6 gap-1 flex-grow";
    for (let row = 1; row <= 6; row++) {
      for (let col = 1; col <= 4; col++) {
        const cell = document.createElement("div");
        const bgClass =
          row <= 2 ? 'bg-purple-50 dark:bg-purple-900/50' :
            row <= 4 ? 'bg-orange-50 dark:bg-orange-900/50' :
              'bg-pink-50 dark:bg-pink-900/40';
        cell.className = `border border-gray-300 dark:border-dark-border rounded ${bgClass} p-1 h-12 flex flex-col items-start justify-start text-xs overflow-hidden`;

        const unit = post.unit_plan.units.find(u => u.col === col && u.row === row);
        if (unit) {
          const nameDiv = document.createElement("div");
          nameDiv.className = "font-semibold text-sm text-gray-800 dark:text-white truncate w-full";
          nameDiv.title = unit.unitname;
          nameDiv.textContent = unit.unitname;

          const codeDiv = document.createElement("div");
          codeDiv.className = "text-xs text-gray-500 dark:text-gray-400 truncate w-full";
          codeDiv.title = unit.unitcode;
          codeDiv.textContent = unit.unitcode;

          cell.appendChild(nameDiv);
          cell.appendChild(codeDiv);
        }
        grid.appendChild(cell);
      }
    }
    card.appendChild(grid);
    feed.appendChild(card);
  });
}



function getText(units, col, row) {
  const unit = units.find(u => u.col === col && u.row === row);
  return unit ? `${unit.unitcode}` : "";
}

function refreshTable() {
  fetch("/friend/get")
    .then(response => response.json())
    .then(data => {
      friends = data;
      renderFriendsTable(friends);
    });
};

function refreshPlansTable() {
  fetch("/plans/user")
    .then(response => response.json())
    .then(data => {
      plans = data;
      renderPlansTable(plans);
    });
};

function refreshPosts() {
  fetch("/share/refresh")
    .then(response => response.json())
    .then(data => {
      posts = data;
      renderPosts(posts);
    });
};
