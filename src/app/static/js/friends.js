let tbody;
let friends = [];
let friend_requests = [];
let input;
let debounceTimer;

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
                                    'Content-Type': 'application/json'
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
            'Content-Type': 'application/json'
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
    const alertDiv = document.createElement('div');
    alertDiv.classList.add('alert', category, 'fade-out');
    alertDiv.innerHTML = `<span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span>${message}`;
    document.querySelector('.absolute-container ul').appendChild(alertDiv);
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
            'Content-Type': 'application/json'
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
            'Content-Type': 'application/json'
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
