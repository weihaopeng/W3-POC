<template lang="pug">
ACard(style="width:480px; height:480px" :bordered="false")
  //- template(#extra)
  //-   a(href="#" @click="onClose") close
  //- template(#title)
  //-   div(style="width: 100%") resource
  div
    div(ref="resourceContainerRef" id="resource-container" style="width: 100%; height: 360px")
</template>

<script>
import { defineComponent, onMounted, ref, watch } from 'vue'
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

    watch(
      () => props.resourceVisible,
      () => {
        visible.value = props.resourceVisible
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

    onMounted(async () => {
      setTimeout(() => {
        const resourceChart = showResource()
        controller.initChart({resourceChart})
      }, 300);
    })

    return {
      resourceContainerRef,
      visible,
      showResource,
      onClose,
    }
  },
})
</script>
