document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    const results = document.getElementById('results');
    let debounceTimer;

    input.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        const query = input.value.trim();

        if (!query) {
            results.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(() => {
            fetch(`/search_units?q=${encodeURIComponent(query)}&type=${searchType.value}`)
                .then(response => response.json())
                .then(data => {
                    results.innerHTML = '';
                    data.forEach(unit => {
                        const li = document.createElement('li');
                        li.textContent = `${unit.unit_name} (${unit.unit_code})`;
                        li.addEventListener('click', () => {
                            input.value = li.textContent;
                            results.innerHTML = '';
                        });
                        results.appendChild(li);
                    });
                });
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!results.contains(e.target) && e.target !== input) {
            results.innerHTML = '';
        }
    });
});