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
          `{important|Attack Success Probability： 1/10}{sup|15}`,
          `                          {important|1 in 1.4 billion} years`
        )
      return text;
    })

    function showPerformance() {
      const performanceChart = echarts.init(performanceContainerRef.value)
      const series = [
        {name: 'In_all', type: 'line', showSymbol: false, data: [{name: 'init1', value: [new Date().toString(), 0]}]},
        {name: 'Out_all', type: 'line', showSymbol: false, data: [{name: 'init2', value: [new Date().toString(), 0]}]}
      ]
      const legend = ['In_all', 'Out_all']

      if (props.config.attackType) {
        legend.push('In_forge', 'Out_forge')
        series.push({name: 'In_forge', type: 'line', showSymbol: false, data: []});
        series.push({name: 'Out_forge', type: 'line', showSymbol: false, data: []});
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
              },
              sup: {
                color: 'red',
                fontSize: 8,
                verticalAlign: 'top'
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
          left: '15%'
        },
        series
      })

      watch(() => props.config.nodeScale, () => {
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
