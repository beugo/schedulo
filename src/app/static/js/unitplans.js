document.addEventListener("DOMContentLoaded", function() {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('results');
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
                    <a onclick="post_share(${unit.id})" class="text-green-600 hover:text-green-900">Share</a>
                    <a href="/plans/view?id=${unit.id}" class="text-blue-600 hover:text-blue-900 ml-2">View</a>
                    <a href="/create?id=${unit.id}" class="text-blue-600 hover:text-blue-900 ml-2">Edit</a>
                    <a onclick="post_delete(${unit.id})" class="text-red-600 hover:text-red-900 ml-2">Delete</a>
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

    input.addEventListener('input', function () {
        const query = input.value.trim().toLowerCase();
        const filtered = allUnits.filter(unit => unit.name.toLowerCase().includes(query));
        renderTable(filtered);
    });
});

function post_share(id){
    fetch(`/share/post?id=${encodeURIComponent(id)}`, {
        method: 'POST',
        body: JSON.stringify({ id: id }),
        headers: {
            'Content-Type': 'application/json'
        } 
    }).then(response => { response.json().then( res => {
            if (res.ok){
                createAlert(res.message, 'success');
            } else{
                createAlert(res.message, 'error');
            }
        })
    })
}
function post_delete(id){
    fetch(`/plans/delete?id=${encodeURIComponent(id)}`, {
        method: 'POST',
        body: JSON.stringify({ id: id }),
        headers: {
            'Content-Type': 'application/json'
        } 
    }).then(response => { response.json().then( res => {
            if (res.ok){
                createAlert(res.message, 'success');
            } else{
                createAlert(res.message, 'error');
            }
        })
        location.reload(); 
    })
}

function createAlert(message, category) {
    const alertDiv = document.createElement('div');
    alertDiv.classList.add('alert', category, 'fade-out');
    alertDiv.innerHTML = `<span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span>${message}`;
    document.querySelector('.absolute-container ul').appendChild(alertDiv);
}
