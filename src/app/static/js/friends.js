let tbody;
let friends = [];
let friend_requests = [];
let input;
let debounceTimer;

const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

document.addEventListener("DOMContentLoaded", function() {
    tbody = document.getElementById('friendTable');
    input = document.getElementById('searchInput');

    refreshTable();
    
    input.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        const query = input.value.trim();

        if (!query) {
            results.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(() => {
            fetch(`/friend/search?q=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    results.innerHTML = '';
                    data.forEach(person => {
                        const li = document.createElement('li');
                        li.textContent = `${person.username}`;
                        li.addEventListener('click', () => {
                            input.value = '';
                            results.innerHTML = '';
                            fetch(`/friend_requests/send?q=${encodeURIComponent(person.username)}`, {
                                method: 'POST',
                                body: JSON.stringify({ q: person.username }),
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRFToken': csrfToken
                                } 
                            }).then(response => { response.json().then( res => {
                                    if (res.ok){
                                        createAlert(res.message, 'success');
                                        refreshTable();
                                    } else{
                                        createAlert(res.message, 'error');
                                    }
                                })
                            })
                        });
                        results.appendChild(li);
                    });
                });
        }, 300);
    });


});
function deleteFriend(username){
    fetch(`/friend/remove?q=${encodeURIComponent(username)}`, {
        method: 'PATCH',
        body: JSON.stringify({ q: username }),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        } 
    }).then(response => { response.json().then( res => {
            if (res.ok){
                createAlert(res.message, 'success');
                refreshTable();
            } else{
                createAlert(res.message, 'error');
            }
        })
    })
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

function createFriendRequest(username, createdAt) {
    const friendReq = document.createElement('div');
    const dateOnly = new Date(createdAt).toDateString();
    friendReq.className = 'border border-gray-700 rounded-xl p-2 mb-3 bg-white dark:bg-gray-800';

    friendReq.innerHTML = `
        <div class="flex flex-col justify-between items-center">
            <div>
              <h4>New Friend Request!</h4>
            </div>
            <div class="flex flex-row w-full p-3">
                <h5 class="flex text-lg font-semibold text-gray-900 dark:text-white">${username}</h5>
                <div class="flex flex-grow"></div>
                 <p class="flex text-sm text-gray-500 dark:text-gray-400">${dateOnly}</p>
            </div>
            <div class="flex space-x-2 flex-row">
                <button class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700" onclick="acceptFriendRequest('${username}', this)" >Accept</button>
                <button class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700" onclick="removeFriendRequest('${username}', this)" >Decline</button>
                <button class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700" onclick="this.closest('div.border').remove()">Dismiss</button>
            </div>
        </div>
    `;

    document.querySelector('.absolute-container ul').appendChild(friendReq);
}
function renderTable(friends) {
    tbody.innerHTML = "";
    friends.forEach(friend => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-100 dark:hover:bg-dark-secondary border border-gray-200 dark:border-dark-border";
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${friend.username}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="deleteFriend('${friend.username}')" class="text-red-600 hover:text-red-900 ml-2">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
function getFriendRequests(){
    fetch("/friend_requests/get")
        .then(response => response.json())
        .then(data => {
            friend_requests = data;
            friend_requests.forEach(req => {
              createFriendRequest(req.username, req.created_at)
            })
        });
    };
getFriendRequests();


function acceptFriendRequest(username, req) {
    fetch(`/friend/add?q=${encodeURIComponent(username)}`, {
        method: 'POST',
        body: JSON.stringify({ q: username }),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        } 
    }).then(response => { response.json().then( res => {
            if (res.ok){
                createAlert(res.message, 'success');
                removeFriendRequest(username, req);
                refreshTable();
            } else{
                createAlert(res.message, 'error');
            }
        })
    })
}

function removeFriendRequest(username, req) {
    fetch(`/friend_requests/remove?q=${encodeURIComponent(username)}`, {
        method: 'PATCH',
        body: JSON.stringify({ q: username }),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        } 
    }).then(response => response.json().then(res => {
      if (res.ok) req.closest('div.border').remove();
    }))
}


function refreshTable(){
    fetch("/friend/get")
        .then(response => response.json())
        .then(data => {
            friends = data;
            renderTable(friends);
        });
    };
