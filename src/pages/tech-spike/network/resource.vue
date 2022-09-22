<template lang="pug">
.resource-charts-group
  .resource-chart-container(ref="resourceContainerRef")
  .resource-statement-container
    .resource-statement-text {{ Number.parseInt(config.nodeScale).toLocaleString() }} nodes in {{ Number.parseInt(config.swarmScale).toLocaleString() }} swarms
    .resource-statement-text sample rate 20 per second
  .gauge-charts-group
    .cpu-gauge-container(ref="cpuGaugeRef")
    .memory-gauge-container(ref="memoryGaugeRef")
    .bandwidth-gauge-container(ref="bandwidthGaugeRef")
</template>

<script>
import { defineComponent, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import controller from '@/pages/tech-spike/network/controller.js'

export default defineComponent({
  name: 'Resource',
  props: {
    config: Object
  },
  emits: ['close'],
  setup: () => {
    const resourceContainerRef = ref(null)
    const cpuGaugeRef = ref(null)
    const memoryGaugeRef = ref(null)
    const bandwidthGaugeRef = ref(null)

    function showResource() {
      const resourceChart = echarts.init(resourceContainerRef.value)
      resourceChart.setOption({
        title: {
          text: 'W3 node resource consumption (avg.)',
          left: '2.5%',
          top: '4.6%',
          textStyle: {
            color: '#000000',
            fontWeight: 'bold',
            fontSize: 20
          }
        },
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['CPU', 'Memory', 'Bandwidth'],
          top: '14%',
          left: '2.2%'
        },
        xAxis: {
          type: 'time',
          splitLine: {
            show: false,
          },
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 100,
          splitLine: {
            show: false,
          },
        },
        grid: {
          left: '10%',
          top: '25%',
          right: '3%'
        },
        color: ['rgb(60,123,253)', 'rgb(145, 204, 117)', 'rgb(250, 200, 88)'],
        series: [
          { name: 'CPU', type: 'line', symbol: 'none', data: [] },
          { name: 'Memory', type: 'line', symbol: 'none', data: [] },
          { name: 'Bandwidth', type: 'line', symbol: 'none', data: [] }
        ],
      })
      const generateGaugeOption = ({name, color1, color2}) => {
        return {
          series: [{
            name,
            type: 'gauge',
            progress: {
              show: true,
              overlap: false,
              roundCap: true,
              itemStyle: {
                borderWidth: 2,
                borderColor: color1
              },
            },
            detail: {
              fontSize: 24,
                offsetCenter: [0, '-20%'],
                valueAnimation: true,
                formatter: function (value) {
                  return Math.round(value) + '%';
                },
                color: '#000'
              },
              axisTick: {
                show: false
              },
              axisLabel: {
                show: false,
                distance: 50
              },
              splitLine: {
                show: false,
                distance: 0,
                length: 10
              },
              pointer: {
                show: false
              },
              anchor: {
                show: false
              },
              title: {
                fontSize: 14,
                offsetCenter: [0, '30%']
              },
              data: [{ value: 50, name }],
              axisLine: { lineStyle: { width: 2 ,color: [[1, color2]] } },
              radius: "100%"
          }]
        }
      }
      const cpuGauge = echarts.init(cpuGaugeRef.value);
      cpuGauge.setOption(generateGaugeOption({ name: 'CPU', color1: 'rgb(60,123,253)', color2: 'rgb(60,123,253, 0.2)' }))

      const memoryGauge = echarts.init(memoryGaugeRef.value);
      memoryGauge.setOption(generateGaugeOption({ name: 'Memory', color1: 'rgb(145, 204, 117)', color2: 'rgb(145, 204, 117, 0.2)' }))

      const bandwidthGauge = echarts.init(bandwidthGaugeRef.value);
      bandwidthGauge.setOption(generateGaugeOption({ name: 'BW', color1: 'rgb(250, 200, 88)', color2: 'rgb(250, 200, 88, 0.2)' }))

      return { resourceChart, cpuGauge, memoryGauge, bandwidthGauge }
    }

    onMounted(async () => {
      setTimeout(() => {
        const { resourceChart, bandwidthGauge, memoryGauge, cpuGauge } = showResource()
        controller.initChart({ resourceChart, bandwidthGauge, memoryGauge, cpuGauge })
      }, 300)
    })

    return {
      resourceContainerRef,
      cpuGaugeRef,
      memoryGaugeRef,
      bandwidthGaugeRef,
      showResource
    }
  },
})
</script>


<style lang="scss" scoped>
  .resource-charts-group {
    background-color: #FFFFFF;
    position: relative;
    border-radius: 4px;
    .resource-chart-container {
      width: 100%;
      height: 100%;
    }
    .resource-statement-container {
      position: absolute;
      top: 4.6%;
      right: 2.5%;
      .resource-statement-text {
        text-align: right;
        font-size: 20px;
        white-space: nowrap;
      }
    }
    .gauge-charts-group {
      position: absolute;
      width: 100%;
      height: 25%;
      top: 25%;
      padding: 0 12.5%;
      display: flex;
      align-items: center;
      justify-content: space-around;
    }
    .cpu-gauge-container, .memory-gauge-container, .bandwidth-gauge-container {
      width: 14%;
      height: 100%;
    }
  }
</style>
