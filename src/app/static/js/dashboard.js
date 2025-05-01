let tbody;
let friends = [];
let input;
let debounceTimer;

document.addEventListener("DOMContentLoaded", function() {
    tbody = document.getElementById('friendTable');
    input = document.getElementById('searchInput');

    refreshTable();

});
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
        `;
        tbody.appendChild(tr);
    });
}

function refreshTable(){
    fetch("/friend/get")
        .then(response => response.json())
        .then(data => {
            friends = data;
            renderTable(friends);
        });
    };
