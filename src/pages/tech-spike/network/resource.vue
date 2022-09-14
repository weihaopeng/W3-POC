<template lang="pug">
ACard(style="width:720px; height:360px" :bordered="false")
  //- template(#extra)
  //-   a(href="#" @click="onClose") close
  //- template(#title)
  //-   div(style="width: 100%") resource
  div
    #resource-container(ref="resourceContainerRef" style="width: 100%; height: 360px")
    #cpuGauge-container(ref="cpuGaugeRef")
    #memoryGauge-container(ref="memoryGaugeRef")
    #bandwidthGauge-container(ref="bandwidthGaugeRef")
</template>

<script>
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
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
    const cpuGaugeRef = ref(null)
    const memoryGaugeRef = ref(null)
    const bandwidthGaugeRef = ref(null)
    const visible = ref(props.resourceVisible)

    watch(
      () => props.resourceVisible,
      () => {
        visible.value = props.resourceVisible
      }
    )

    const subTitleText = computed(() => {
      return [
        `${props.config.nodeScale.toLocaleString()} nodes in ${props.config.swarmScale.toLocaleString()} swarms`,
        `sample rate 20 per second`
      ]
    })

    function showResource() {
      const resourceChart = echarts.init(resourceContainerRef.value)
      resourceChart.setOption({
        title: {
          text: 'w3 node resource consumption (avg.)',
          subtext: subTitleText.value.join('\n'),
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
          { name: 'CPU', type: 'line', showSymbol: false, data: [], lineStyle: {color: 'red'} },
          { name: 'Memory', type: 'line', showSymbol: false, data: [], lineStyle: {color: 'green'} },
          { name: 'Bandwidth', type: 'line', showSymbol: false, data: [], lineStyle: {color: 'blue'} }
        ],
      })

      watch(() => props.config.swarmScale, () => {
        // console.log('swarmScale', props.config)
        resourceChart.setOption({
          title: {
            subtext: subTitleText.value.join('\n'),
          }
        })
      })

      watch(() => props.config.swarmScale, () => {
        resourceChart.setOption({
          title: {
            subtext: subTitleText.value.join('\n'),
          }
        })
      })

      const gaugeOption = {
        type: 'gauge',
        detail: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          distance: 0,
          fontSize: 5
        },
        splitLine: {
          distance: -30,
          length: 30,
          lineStyle: {
            color: '#fff',
            width: 4
          }
        },
        pointer: {
          width: 1
        },
        anchor: {
          show: false
        },
        title: {
          fontSize: 10
        }
      }

      const cpuGauge = echarts.init(cpuGaugeRef.value)
      cpuGauge.setOption({
        series: [
          { name: 'Cpu', data: [{ value: 50, name: 'CPU' }], axisLine: { lineStyle: { width: 2, color: [[1, 'red']] } }, ...gaugeOption }
        ]
      })

      const memoryGauge = echarts.init(memoryGaugeRef.value)
      memoryGauge.setOption({
        series: [
          {name: 'Memory', data: [{ value: 50, name: 'Memory' }], axisLine: { lineStyle: { width: 2, color: [[1, 'green']] }}, ...gaugeOption }
        ]
      })

      const bandwidthGauge = echarts.init(bandwidthGaugeRef.value)
      bandwidthGauge.setOption({
        series: [
          {name: 'Bandwidth', data: [{ value: 50, name: 'BW' }], axisLine: { lineStyle: { width: 2, color: [[1, 'blue']] } }, ...gaugeOption }
        ]
      })
      return { resourceChart, cpuGauge, memoryGauge, bandwidthGauge }
    }

    const onClose = () => {
      emit('close');
    }

    onMounted(async () => {
      setTimeout(() => {
        const { resourceChart, bandwidthGauge, memoryGauge, cpuGauge } = showResource()
        controller.initChart({ memoryChart: resourceChart, bandwidthGauge, memoryGauge, cpuGauge })
      }, 300);
    })

    return {
      resourceContainerRef,
      visible,
      cpuGaugeRef,
      memoryGaugeRef,
      bandwidthGaugeRef,
      showResource,
      onClose,
    }
  },
})
</script>

<style lang="scss" scoped>
#cpuGauge-container, #memoryGauge-container, #bandwidthGauge-container {
  width: 120px;
  height: 120px;
  position: relative;
}

#cpuGauge-container {
  top: -260px;
  left: 100px;
}

#memoryGauge-container {
  top: -380px;
  left: 200px;
}

#bandwidthGauge-container {
  top: -500px;
  left: 300px;
}
  
</style>