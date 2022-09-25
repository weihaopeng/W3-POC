<template lang="pug">
.performance-chart-wrapper
  .performance-chart-container(ref="performanceContainerRef")
  .performance-statement-container
    .performance-statement-text {{ Number.parseInt(config.nodeScale).toLocaleString() }} nodes in {{ Number.parseInt(config.swarmScale).toLocaleString() }} swarms
    .performance-statement-text sample rate 20 per second
    .performance-statement-text.highlight(v-if="displayAttackLine")
      | Attack Success Probability: 1/10
      sup 15
    .performance-statement-text.highlight(v-if="displayAttackLine") 1 in 1.4 billion years
</template>

<script>
import { defineComponent, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import controller from '@/pages/network/composition/controller.js'

export default defineComponent({
  name: 'Performance',
  props: {
    config: Object
  },
  emits: ['changeConfig'],
  setup: (props) => {
    const performanceContainerRef = ref(null)
    const displayAttackLine = ref(false)

    function showPerformance() {
      const performanceChart = echarts.init(performanceContainerRef.value)
      console.log(Math.ceil(performanceContainerRef.value.offsetWidth / 40))

      const generateOption = (startAttackSimulate) => {
        const series = [
          { name: 'In_all', type: 'line', symbol: 'none', data: [{ name: 'init1', value: [new Date().toString(), 0] }] },
          { name: 'Out_all', type: 'line', symbol: 'none', data: [{ name: 'init2', value: [new Date().toString(), 0] }] }
        ];
        const legend = ['In_all', 'Out_all']

        if (startAttackSimulate) {
          legend.push('In_forge', 'Out_forge')
          series.push({ name: 'In_forge', type: 'line', symbol: 'none', data: [] });
          series.push({ name: 'Out_forge', type: 'line', symbol: 'none', data: [] });
        }
        return {
          title: {
            text: 'W3 network performance',
            // subtext: subTitleText.value.join('\n'),
            left: '2.5%',
            top: '4.6%',
            textStyle: {
              color: '#000000',
              fontWeight: 'bold',
              fontSize: 20
            }
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: legend,
            top: '14%',
            left: '2.2%'
          },
          xAxis: {
            type: 'time',
            splitLine: {
              show: false
            }
          },
          yAxis: {
            type: 'value',
            boundaryGap: [0, '60%'],
            splitLine: {
              show: false
            },
          },
          grid: {
            left: '12%',
            top: '25%',
            right: '3%'
          },
          color: ['rgb(60,123,253)', 'rgb(145, 204, 117)', 'rgb(232,104,74)', 'rgb(246,189,22)'],
          series
        }
      }
      performanceChart.setOption(generateOption(props.config.startAttackSimulate))

      watch(() => props.config.startAttackSimulate, () => {
        controller.withAttacker = props.config.startAttackSimulate
        controller.performanceWithAttackerChartInboundData = []
        controller.performanceWithAttackerChartOutboundData = []
        performanceChart.clear()
        performanceChart.setOption(generateOption(props.config.startAttackSimulate))

        if (props.config.startAttackSimulate) {
            setTimeout(() => displayAttackLine.value = true, 2000);
          } else {
            displayAttackLine.value = false;
          }
        })

      return performanceChart
    }

    onMounted(async () => {
      setTimeout(() => {
        const performanceChart = showPerformance()
        controller.initChart({ performanceChart, withAttacker: props.config.startAttackSimulate })
      }, 300)
    })

    return {
      performanceContainerRef,
      showPerformance,
      displayAttackLine
    }
  }
})
</script>

<style lang="scss">
  .performance-chart-wrapper {
    background-color: #FFFFFF;
    position: relative;
    border-radius: 4px;
    .performance-chart-container {
      width: 100%;
      height: 100%;
    }
    .performance-statement-container {
      position: absolute;
      top: 4.6%;
      right: 2.5%;
      .performance-statement-text {
        text-align: right;
        font-size: 20px;
        white-space: nowrap;
        &.highlight {
          color: #FF1D1D;
        }
      }
    }
  }
</style>
