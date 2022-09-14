<template lang="pug">
div
  ASpace
    AButton(@click="showConfig") config
    AButton(@click="showResult") result
div
  WorldMap
Performance(:performance-visible="visible.performance" @close="closePerformance" :config="config")
Resource(:resource-visible="visible.resource" @close="closeResource" :config="config")
ADrawer(title="config" v-model:visible="configVisible" placement="left" @close="onConfigClose")
  NetworkConfig(:default-config="config" @change-config="onChangeConfig")
</template>

<script>
import { defineComponent, ref } from 'vue'
import 'echarts-gl'
import WorldMap from '@/pages/tech-spike/network/world-map.vue'
import Performance from '@/pages/tech-spike/network/performance.vue'
import Resource from '@/pages/tech-spike/network/resource.vue'
import NetworkConfig from '@/pages/tech-spike/network/network-config.vue'
import controller from "@/pages/tech-spike/network/controller.js"

export default defineComponent({
  name: 'Benchmark',
  components: {
    WorldMap,
    Performance,
    Resource,
    NetworkConfig,
  },
  setup: () => {
    const configVisible = ref(false)
    const visible = ref({
      performance: false,
      resource: false
    })

    const onConfigClose = () => {
      console.log('close')
      configVisible.value = false
    }

    const showConfig = () => {
      configVisible.value = true
    }

    const showResult = () => {
      visible.value.performance = true
      visible.value.resource = true
    }

    const closePerformance = () => {
       visible.value.performance = false;
     }
 
    const closeResource = () => {
      visible.value.resource = false;
    }

    const config = ref({
      nodeScale: 10,
      latencyInSwarm: 20,
      latencyBetweenSwarm: 100,
      tps: 15,
      swarmScale: 1
    })

    controller.setNodesScale(config.value.nodeScale, 0);
    controller.autoGenerateTx(config.value.tps)

    const onChangeConfig = (newConfig) => {
      console.log('change config', newConfig)
      controller.setNodesScale(newConfig.nodeScale, 0);
      controller.autoGenerateTx(newConfig.tps)
      config.value.nodeScale = newConfig.nodeScale
      config.value.tps = newConfig.tps;
      config.swarmScale = Math.ceil(newConfig.nodeScale / (50 + Math.random() * 50))
    }

    return {
      configVisible,
      visible,
      config,
      showResult,
      onConfigClose,
      showConfig,
      onChangeConfig,
      closePerformance,
      closeResource
    }
  },
})
</script>
