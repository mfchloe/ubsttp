// BarChart.vue
<template>
  <div class="chart-container">
    <canvas ref="barChart"></canvas>
  </div>
</template>

<script>
import { onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';

export default {
  name: 'BarChart',
  props: {
    chartData: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const barChart = ref(null);
    let chart = null;

    // Create chart
    const createChart = () => {
      const ctx = barChart.value.getContext('2d');
      
      chart = new Chart(ctx, {
        type: 'bar',
        data: props.chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: 10,
              titleFont: {
                size: 14
              },
              bodyFont: {
                size: 14
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                precision: 0
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    };

    // Update chart when data changes
    watch(() => props.chartData, (newData) => {
      if (chart) {
        chart.data = newData;
        chart.update();
      }
    }, { deep: true });

    onMounted(() => {
      createChart();
    });

    return {
      barChart
    };
  }
};
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 250px;
  width: 100%;
}
</style>