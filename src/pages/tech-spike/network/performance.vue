<template lang="pug">
AModal.performance-modal(
  ref="modalRef", v-model:visible="visible", :wrap-style="{ overflow: 'hidden' }"
  :footer="null", :mask="false", :maskClosable="false", :forceRender="true", :keyboard="false", @cancel="onClose"
)
  template(#title)
    div(style="width: 100%; cursor: move") performance
  div
    div(ref="performanceContainerRef" id="performance-container" style="width: 100%; height: 360px")
</template>

<script>
import { defineComponent, ref, watch } from 'vue'
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
    let renderChart = false

    watch(
      () => props.performanceVisible,
      () => {
        visible.value = props.performanceVisible
        if (!renderChart) {
          setTimeout(() => {
            const performanceChart = showPerformance()
            controller.initChart({performanceChart})
          }, 300);
          renderChart = true;
        }
      }
    )

    function showPerformance() {
      const performanceChart = echarts.init(performanceContainerRef.value)
      performanceChart.setOption({
        title: {
          text: 'w3 network performance',
          subtext: `${props.config.nodeScale.toLocaleString()} nodes in ${props.config.swarmScale.toLocaleString()} swarms\nsample rate 20 per second`,
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['Inbound', 'Outbound'],
          top: '20%'
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

    return {
      performanceContainerRef,
      visible,
      showPerformance,
      onClose
    }
  }
})
</script>

<style lang="scss">
.performance-modal {
  transform: translateX(550px);
}
</style>
