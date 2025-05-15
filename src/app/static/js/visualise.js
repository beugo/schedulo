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
              backgroundColor: 'rgba(29, 71, 225, 1)'
            },
            {
              label: 'Total Picks',
              data: data.total_count,
              backgroundColor: 'rgba(192, 75, 75, 1)'
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

