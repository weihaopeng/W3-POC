<template lang="pug">
AButton(@click="showConfig") config
ARow
  ACol(:span="16")
    WorldMap
  ACol(:span="6")
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
import controller from '@/pages/tech-spike/network/controller.js'

export default defineComponent({
  name: 'Security',
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
      resource: false,
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
      visible.value.performance = false
    }

    const closeResource = () => {
      visible.value.resource = false
    }

    const config = ref({
      nodeScale: 10,
      latencyInSwarm: 20,
      latencyBetweenSwarm: 100,
      tps: 15,
      swarmScale: 1,
      attackType: 'Finney',
      forgeAccountRatio: 30,
    })

    const attackerScale = Math.floor((config.value.nodeScale * config.value.forgeAccountRatio) / 100)
    controller.setNodesScale(config.value.nodeScale, attackerScale)
    controller.autoGenerateTx(config.value.tps)

    const onChangeConfig = (newConfig) => {
      console.log('change config', newConfig)
      const attackerScale = Math.floor((newConfig.nodeScale * newConfig.forgeAccountRatio) / 100)
      controller.setNodesScale(newConfig.nodeScale, attackerScale)
      controller.autoGenerateTx(newConfig.tps)
      config.value.nodeScale = newConfig.nodeScale
      config.value.tps = newConfig.tps
      config.swarmScale = Math.ceil(newConfig.nodeScale / (50 + Math.random() * 50))
      config.forgeAccountRatio = newConfig.forgeAccountRatio
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
      closeResource,
    }
  },
})
</script>
