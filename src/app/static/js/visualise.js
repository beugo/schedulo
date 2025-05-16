document.addEventListener("DOMContentLoaded", () => {
  const friendBtn = document.getElementById('friendPicks');
  const totalBtn = document.getElementById('totalPicks');
  Chart.register(ChartDataLabels);
  const ctx = document.getElementById('unit_data').getContext('2d');
  let currentType = 'friend';
  let chart;

  //heatmap colors
  const palette = [
    '#ffa600',
    '#ff7c43',
    '#f95d6a',
    '#d45087',
    '#a05195',
    '#665191',
    '#2f4b7c',
    '#003f5c',
    '#2f4b7c',
    '#665191',
    '#a05195', 
    '#d45087', 
    '#f95d6a', 
    '#ff7c43'
  ];

  function isDarkMode() { //checks if any of the current elements contain the dark class
    return document.documentElement.classList.contains('dark');
  }

  function interpolateColor(startColor, endColor, factor) {
    // take the r g and b values and turn them into ints
    const start = startColor.match(/\w\w/g).map(x => parseInt(x, 16));
    const end = endColor.match(/\w\w/g).map(x => parseInt(x, 16));

    // interpolate the ints
    const result = start.map((startValue, i) => 
      Math.round(startValue + factor * (end[i] - startValue))
    );

    // convert back to hex format
    return '#' + result.map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function buildOrUpdate(data) {
    // filter out data with 0 entries
    const filteredData = {
      labels: [],
      friend_count: [],
      total_count: []
    };
    
    const values = currentType === 'friend' ? data.friend_count : data.total_count;
    
    // Create filtered array
    data.labels.forEach((label, i) => {
      if (values[i] !== 0) {
        filteredData.labels.push(label);
        filteredData.friend_count.push(data.friend_count[i]);
        filteredData.total_count.push(data.total_count[i]);
      }
    });

    const labels = filteredData.labels;
    const filteredValues = currentType === 'friend' ? filteredData.friend_count : filteredData.total_count;
    const dark = isDarkMode();

    // give all of the bars a nice color using the pallete and the interpolation function
    const colors = labels.map((_, i) => {
      const totalSteps = labels.length - 1;
      const t = i / totalSteps;
      const scaledT = t * (palette.length - 1);
      const lowerIndex = Math.floor(scaledT);
      const upperIndex = Math.min(lowerIndex + 1, palette.length - 1);
      const localT = scaledT - lowerIndex;
      return interpolateColor(palette[lowerIndex], palette[upperIndex], localT);
    });

    ctx.canvas.height = labels.length * 50; // the labels are too big??

    const dataset = {
      label: currentType === 'friend' ? 'Friend Picks' : 'Total Picks',
      data: filteredValues,
      backgroundColor: colors,
      // adjust these to mess around with the bar thicnkess and padding
      borderRadius: 6,
      maxBarThickness: 30,
      barPercentage: 1.2,
      categoryPercentage: 0.6
    };
    // darkmode variants TODO: have the graph redraw when the user togles between the two modes
    const gridColor = dark ? 'rgba(255,255,255,0.05)' : 'rgba(229,231,235,0.3)';
    const fontColor = dark ? '#D1D5DB' : '#6B7280';
    const labelColor = dark ? '#F9FAFB' : '#111827';

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: {
            font: { family: 'Inter, sans-serif', size: 12 },
            color: fontColor
          }
        },
        y: {
          ticks: {
            padding: 12,
            font: { family: 'Inter, sans-serif', size: 13, weight: '600' },
            color: labelColor
          },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: dark ? '#111827' : '#1F2937',
          titleColor: dark ? '#F9FAFB' : '#F9FAFB',
          bodyColor: dark ? '#D1D5DB' : '#D1D5DB',
          cornerRadius: 6,
          padding: 10,
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.x}`
          }
        },
        datalabels: {
          anchor: 'start',
          align: 'end',
          color: '#F9FAFB',
          font: {
            family: 'Inter, sans-serif',
            size: 12,
            weight: '600'
          },
          formatter: value => value
        }
      }
    };

    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets = [dataset];
      chart.options = chartOptions;
      chart.update();
    } else {
      chart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [dataset] },
        options: chartOptions
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