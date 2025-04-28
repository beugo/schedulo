let tbody;
let friends = [];
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
            fetch(`/search_friends?q=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    results.innerHTML = '';
                    data.forEach(person => {
                        const li = document.createElement('li');
                        li.textContent = `${person.username}`;
                        li.addEventListener('click', () => {
                            input.value = '';
                            results.innerHTML = '';
                            fetch(`/add_friend?q=${encodeURIComponent(person.username)}`, {
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
    fetch(`/remove_friend?q=${encodeURIComponent(username)}`, {
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
function renderTable(friends) {
    tbody.innerHTML = "";
    friends.forEach(friend => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-100 dark:hover:bg-dark-secondary";
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${friend.username}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="deleteFriend('${friend.username}')" class="text-red-600 hover:text-red-900 ml-2">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function refreshTable(){
    fetch("/get_friends")
        .then(response => response.json())
        .then(data => {
            friends = data;
            renderTable(friends);
        });
    };
