document.addEventListener("DOMContentLoaded", () => {
  const friendBtn = document.getElementById('friendPicks');
  const totalBtn  = document.getElementById('totalPicks');
  const ctx       = document.getElementById('unit_data').getContext('2d');
  let currentType = 'friend';
  let chart;

  function buildOrUpdate(data) {
    const labels = data.labels;
    const values = currentType === 'friend'
      ? data.friend_count
      : data.total_count;
    const color  = currentType === 'friend'
      ? 'rgba(29, 71, 225, 1)'
      : 'rgba(192, 75, 75, 1)';

    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets = [{ label:
           currentType === 'friend' ? 'Friend Picks' : 'Total Picks',
           data: values,
           backgroundColor: color
      }];
      chart.update();
    } else {
      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: currentType === 'friend' ? 'Friend Picks' : 'Total Picks',
            data: values,
            backgroundColor: color
          }]
        },
        options: {
          indexAxis: 'y',
          scales: { x: { beginAtZero: true } }
        }
      });
    }
  }

  function fetchData() {
    fetch('/chart/unit_data')
      .then(res => res.json())
      .then(buildOrUpdate);
  }

  friendBtn.addEventListener('click', () => {
    currentType = 'friend';
    fetchData();
  });

  totalBtn.addEventListener('click', () => {
    currentType = 'total';
    fetchData();
  });

  fetchData();
});
