<template lang="pug">
AModal(
  ref="modalRef" v-model:visible="visible" :wrap-style="{ overflow: 'hidden' }" :footer="null"
  :mask="false" :forceRender="true" :keyboard="false" @cancel="onClose"
)
  template(#title)
    div(style="width: 100%; cursor: move") resource
  div
    div(ref="resourceContainerRef" id="resource-container" style="width: 100%; height: 360px")
</template>

<script>
import { defineComponent, ref, watch } from 'vue'
import * as echarts from 'echarts'
import 'echarts-gl'
import controller from "@/pages/tech-spike/network/controller.js";

export default defineComponent({
  name: 'Resource',
  props: {
    resourceVisible: Boolean,
    config: Object
  },
  emits: ["close"],
  setup: (props, { emit }) => {
    const resourceContainerRef = ref(null)
    const visible = ref(props.resourceVisible)

    let renderChart = false
    watch(
      () => props.resourceVisible,
      () => {
        visible.value = props.resourceVisible
        if (!renderChart) {
          setTimeout(() => {
            const resourceChart = showResource()
            controller.initChart({memoryChart: resourceChart})
          }, 300)
          renderChart = true
        }
      }
    )

    function showResource() {
      const resourceChart = echarts.init(resourceContainerRef.value)
      resourceChart.setOption({
        title: {
          text: 'w3 node resource consumption (avg.)',
          subtext: `${props.config.nodeScale.toLocaleString()} nodes in ${props.config.swarmScale.toLocaleString()} swarms\nsample rate 20 per second`,
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['CPU', 'Memory', 'Bandwidth'],
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
          min: 0,
          max: 100,
          splitLine: {
            show: false,
          },
        },
        series: [
          {
            name: 'CPU',
            type: 'line',
            showSymbol: false,
            data: [
              // {name: 'init1', value: [new Date().toString(), 0]}
            ],
          },
          {
            name: 'Memory',
            type: 'line',
            showSymbol: false,
            data: [
              // {name: 'init1', value: [new Date().toString(), 0]}
            ],
          },
          {
            name: 'Bandwidth',
            type: 'line',
            showSymbol: false,
            data: [
              // {name: 'init2', value: [new Date().toString(), 0]}
            ],
          },
        ],
      })
      return resourceChart
    }
    const onClose = () => {
      emit('close');
    }

    return {
      resourceContainerRef,
      visible,
      showResource,
      onClose,
    }
  },
})
</script>
