// PieChart.vue
<template>
  <div class="chart-container">
    <canvas ref="pieChart"></canvas>
  </div>
</template>

<script>
import { onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';

export default {
  name: 'PieChart',
  props: {
    chartData: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const pieChart = ref(null);
    let chart = null;

    // Create chart
    const createChart = () => {
      const ctx = pieChart.value.getContext('2d');
      
      chart = new Chart(ctx, {
        type: 'doughnut',
        data: props.chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 12,
                padding: 15,
                font: {
                  size: 12
                }
              }
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
          cutout: '60%'
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
      pieChart
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