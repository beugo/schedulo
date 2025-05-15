document.addEventListener("DOMContentLoaded", function() {
  fetch('/chart/unit_data')
    .then(res => res.json())
    .then(data => {
      new Chart(document.getElementById('unit_data'), {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'Friend Picks',
              data: data.friend_count,
              backgroundColor: 'rgba(75, 192, 192, 0.6)'
            },
            {
              label: 'Total Picks',
              data: data.total_count,
              backgroundColor: 'rgba(192, 75, 75, 0.6)'
            }
          ]
        },
        options: {
          indexAxis: 'y',
          scales: {
            x: {
              beginAtZero: true
            }
          }
        }
      });
    });
});

function createAlert(message, category) {
  const alertDiv = document.createElement('div');
  alertDiv.classList.add('alert', category, 'fade-out');
  alertDiv.innerHTML = `<span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span>${message}`;
  document.querySelector('.absolute-container ul').appendChild(alertDiv);
}
