<template lang="pug">
ACard(style="width: 480px" :bordered="false")
  //- template(#extra)
  //-   a(href="#" @click="onCLose") close
  //- template(#title)
  //-   div(style="width: 100%") performance
  div
    div(ref="performanceContainerRef" id="performance-container" style="width: 100%; height: 360px")
</template>

<script>
import { defineComponent, onMounted, ref, watch } from 'vue'
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

    function showPerformance() {
      const performanceChart = echarts.init(performanceContainerRef.value)
      performanceChart.setOption({
        title: {
          text: 'w3 network performance',
          subtext: `${props.config.nodeScale.toLocaleString()} nodes in ${props.config.swarmScale.toLocaleString()} swarms\n` +
                  `sample rate 20 per second\n` +
                  `{important|Attack Success Probability： 1/e+15}\n` +
                  `                          {important|1 in 1.4 billion} years`,
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
          data: ['Inbound', 'Outbound'],
          top: '25%'
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
        series: [
          {
            name: 'Inbound',
            type: 'line',
            showSymbol: false,
            data: [
              // {name: 'init1', value: [new Date().toString(), 0]}
            ],
          },
          {
            name: 'Outbound',
            type: 'line',
            showSymbol: false,
            data: [
              // {name: 'init2', value: [new Date().toString(), 0]}
            ],
          },
        ],
      })
      return performanceChart
    }

    const onClose = () => {
      emit('close');
    }

    onMounted(async () => {
      setTimeout(() => {
        const performanceChart = showPerformance()
        controller.initChart({performanceChart})
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
