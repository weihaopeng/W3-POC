<template lang="pug">
#performance-title-container
  #performance-chart-container(ref="performanceContainerRef")
  #performance-statement-container
    .performance-statement-text {{ Number.parseInt(config.nodeScale).toLocaleString() }} nodes in {{ Number.parseInt(config.swarmScale).toLocaleString() }} swarms
    .performance-statement-text sample rate 20 per second
    .performance-statement-text(v-if="config.isAttackSimulate && config.startAttackSimulate" style="color: #FF0000;")
      | Attack Success Probability: 1/10
      sup 15
    .performance-statement-text(v-if="config.isAttackSimulate && config.startAttackSimulate" style="color: #FF0000;") 1 in 1.4 billion years
</template>

<script>
import { defineComponent, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import controller from '@/pages/tech-spike/network/controller.js'

export default defineComponent({
  name: 'Performance',
  props: {
    config: Object
  },
  emits: ['changeConfig'],
  setup: (props) => {
    const performanceContainerRef = ref(null)

    function showPerformance() {
      const performanceChart = echarts.init(performanceContainerRef.value)

      const generateOption = (isAttackSimulate) => {
        const series = [
          { name: 'In_all', type: 'line', symbol: 'none', data: [{ name: 'init1', value: [new Date().toString(), 0] }] },
          { name: 'Out_all', type: 'line', symbol: 'none', data: [{ name: 'init2', value: [new Date().toString(), 0] }] }
        ];
        const legend = ['In_all', 'Out_all']

        if (isAttackSimulate) {
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
              fontSize: Math.ceil(performanceContainerRef.value.offsetWidth / 40)
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
            top: '25%'
          },
          series
        }
      }
      performanceChart.setOption(generateOption(props.config.isAttackSimulate))

      watch(() => props.config.startAttackSimulate, () => {
        controller.withAttacker = props.config.startAttackSimulate
        controller.performanceWithAttackerChartInboundData = []
        controller.performanceWithAttackerChartOutboundData = []
        performanceChart.clear()
        performanceChart.setOption(generateOption(props.config.isAttackSimulate))
      })
      return performanceChart
    }

    onMounted(async () => {
      setTimeout(() => {
        const performanceChart = showPerformance()
        controller.initChart({ performanceChart, withAttacker: !!props.config.attackType })
      }, 300)
    })

    return {
      performanceContainerRef,
      showPerformance
      
    }
  }
})
</script>

<style lang="scss">
  #performance-chart-container {
    width: 100%;
    height: 100%;
    background-color: #FFFFFF;
    position: relative;
    border-radius: 4px;
  }
  #performance-statement-container {
    width: 40%;
    height: 20%;
    position: relative;
    top: -95%;
    left: 60%;
  }
  .performance-statement-text {
    float: right;
    padding-right: 5%;
    font-size: 1.5vh;
  }
</style>