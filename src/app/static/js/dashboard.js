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
function createAlert(message, category) {
  const alertDiv = document.createElement('div');
  alertDiv.classList.add('alert', category, 'fade-out');
  alertDiv.innerHTML = `<span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span>${message}`;
  document.querySelector('.absolute-container ul').appendChild(alertDiv);
}
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
    tr.className = "hover:bg-gray-100 dark:hover:bg-dark-secondary";
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
  if (posts.length === 0) {
    const div = document.createElement("div");
    div.className = "w-full bg-white dark:bg-dark-fg border dark:border-dark-border rounded-lg p-6 shadow text-center text-gray-600 dark:text-dark-secondary";
    div.innerHTML = `Your friend feed is empty for now. When friends share unit plans, they’ll appear here!`;
    feed.appendChild(div);
  } else {
    posts.forEach(post => {
      const div = document.createElement("div");
      div.id = "post";
      div.onclick = () => {
        window.location.href = `/plans/view?id=${post.id}`;
      };
      div.className = "bg-white dark:bg-dark-fg border dark:border-dark-border rounded-lg p-4 shadow h-[45vh]";
      div.innerHTML = `
              <div class="flex flex-col h-full gap-4">
                <div class="flex flex-row items-center text-center">
                  <h3 class="font-bold text-lg">${post.unit_plan.name}</h3>
                  <div class="flex flex-grow"></div>
                  <p class="text-sm text-gray-500">${post.user_name} • ${new Date(post.posted_at).toLocaleString()}</p>
                </div>
                <div class="grid h-full w-full flex-grow" style="grid-template-columns: repeat(4, 20%); grid-template-rows: repeat(6, 12%); justify-content: center; align-content: space-between; gap: 15px;">
                  <!-- Year 1 -->
                  <div class="flex justify-center items-center text-xs border-2 border-purple-500 col-start-1 row-start-1 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 1, 1)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-purple-500 col-start-2 row-start-1 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 2, 1)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-purple-500 col-start-3 row-start-1 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 3, 1)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-purple-500 col-start-4 row-start-1 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 4, 1)}</div>

                  <div class="flex justify-center items-center text-xs border-2 border-purple-500 col-start-1 row-start-2 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 1, 2)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-purple-500 col-start-2 row-start-2 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 2, 2)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-purple-500 col-start-3 row-start-2 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 3, 2)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-purple-500 col-start-4 row-start-2 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 4, 2)}</div>

                  <!-- Year 2 -->
                  <div class="flex justify-center items-center text-xs border-2 border-orange-500 col-start-1 row-start-3 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 1, 3)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-orange-500 col-start-2 row-start-3 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 2, 3)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-orange-500 col-start-3 row-start-3 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 3, 3)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-orange-500 col-start-4 row-start-3 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 4, 3)}</div>

                  <div class="flex justify-center items-center text-xs border-2 border-orange-500 col-start-1 row-start-4 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 1, 4)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-orange-500 col-start-2 row-start-4 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 2, 4)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-orange-500 col-start-3 row-start-4 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 3, 4)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-orange-500 col-start-4 row-start-4 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 4, 4)}</div>

                  <!-- Year 3 -->
                  <div class="flex justify-center items-center text-xs border-2 border-pink-400 col-start-1 row-start-5 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 1, 5)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-pink-400 col-start-2 row-start-5 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 2, 5)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-pink-400 col-start-3 row-start-5 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 3, 5)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-pink-400 col-start-4 row-start-5 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 4, 5)}</div>

                  <div class="flex justify-center items-center text-xs border-2 border-pink-400 col-start-1 row-start-6 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 1, 6)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-pink-400 col-start-2 row-start-6 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 2, 6)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-pink-400 col-start-3 row-start-6 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 3, 6)}</div>
                  <div class="flex justify-center items-center text-xs border-2 border-pink-400 col-start-4 row-start-6 rounded-lg bg-gray-200 border dark:bg-dark-border">${getText(post.unit_plan.units, 4, 6)}</div>
              </div>
            </div>
          `;
      feed.appendChild(div);
    });
  }
};

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
