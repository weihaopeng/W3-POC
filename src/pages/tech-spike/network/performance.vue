<template lang="pug">
ACard(style="width: 720px; height: 360px;" :bordered="false")
  //- template(#extra)
  //-   a(href="#" @click="onCLose") close
  //- template(#title)
  //-   div(style="width: 100%") performance
  div
    #performance-container(ref="performanceContainerRef" style="width: 100%; height: 360px")
</template>

<script>
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import 'echarts-gl'
import controller from "@/pages/tech-spike/network/controller.js";

export default defineComponent({
  name: 'Performance',
  props: {
    performanceVisible: Boolean,
    config: Object
  },
  emits: ["close"],
  setup: (props, { emit }) => {
    const performanceContainerRef = ref(null)
    const visible = ref(props.performanceVisible)

    watch(
      () => props.performanceVisible,
      () => {
        visible.value = props.performanceVisible
      }
    )

    const subTitleText = computed(() => {
      const text = [
        `${Number.parseInt(props.config.nodeScale).toLocaleString()} nodes in ${Number.parseInt(props.config.swarmScale).toLocaleString()} swarms`,
        `sample rate 20 per second`
      ]
      if (props.config.attackType)
        text.push(
          `{important|Attack Success Probability： 1/e+15}`,
          `                          {important|1 in 1.4 billion} years`
        )
      return text;
    })

    function showPerformance() {
      const performanceChart = echarts.init(performanceContainerRef.value)
      const series = [
        {name: 'In', type: 'line', showSymbol: false, data: [{name: 'init1', value: [new Date().toString(), 0]}]},
        {name: 'Out', type: 'line', showSymbol: false, data: [{name: 'init2', value: [new Date().toString(), 0]}]}
      ]
      const legend = ['In', 'Out']

      if (props.config.attackType) {
        legend.push('ForgeIn', 'ForgeOut')
        series.push({name: 'ForgeIn', type: 'line', showSymbol: false, data: []});
        series.push({name: 'ForgeOut', type: 'line', showSymbol: false, data: []});
      }

      performanceChart.setOption({
        title: {
          text: 'w3 network performance',
          subtext: subTitleText.value.join('\n'),
          left: 'center',
          subtextStyle: {
            rich: {
              important: {
                color: 'red'
              }
            }
          }
        },
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: legend,
          top: props.config.attackType ? '25%' : '15%'
        },
        xAxis: {
          type: 'time',
          splitLine: {
            show: false,
          },
        },
        yAxis: {
          type: 'value',
          boundaryGap: [0, '100%'],
          boundaryGap: [0, '60%'],
          splitLine: {
            show: false,
          },
        },
        grid: {
          left: '10%'
        },
        series
      })

      watch(() => props.config.swarmScale, () => {
        // console.log('swarmScale', props.config)
        performanceChart.setOption({
          title: {
            subtext: subTitleText.value.join('\n'),
          }
        })
      })

      watch(() => props.config.swarmScale, () => {
        performanceChart.setOption({
          title: {
            subtext: subTitleText.value.join('\n'),
          }
        })
      })

      return performanceChart
    }

    const onClose = () => {
      emit('close');
    }

    onMounted(async () => {
      setTimeout(() => {
        const performanceChart = showPerformance()
        controller.initChart({ performanceChart, withAttacker: !!props.config.attackType })
      }, 300);
    })

    return {
      performanceContainerRef,
      visible,
      showPerformance,
      onClose
    }
  }
})
</script>
