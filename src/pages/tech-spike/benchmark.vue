<template lang="pug">
APageHeader(
  style="border: 1px solid rgb(235, 237, 240); display: flex; justify-content: center;"
  :title="`W3 chain height ${Math.floor(config.chainHeight)}　　　　　total transactions ${config.totalTransactions}`"
)
AButton(@click="showConfig") config
    //- AButton(@click="showResult") result
//- div
//-   WorldMap
ARow
  ACol(:span="12")
    WorldMap(:config="config")
  ACol(:span="6")
    Performance(:performance-visible="visible.performance" @close="closePerformance" :config="config")
    Resource(:resource-visible="visible.resource" @close="closeResource" :config="config")
ADrawer(title="W3 Network Configuration" v-model:visible="configVisible" placement="left" @close="onConfigClose")
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
      nodeScale: 1000,
      latencyInSwarm: 20,
      latencyBetweenSwarm: 100,
      tps: 15,
      swarmScale: 1,
      forgeAccountRatio: 0,
      chainHeight: 181311,
      totalTransactions: 103123414
    })

    controller.setNodesScale(config.value.nodeScale, 0);
    controller.autoGenerateTx(config.value.tps)

    let timer = setInterval(() => {
      config.value.chainHeight += config.value.tps / 50;
      config.value.totalTransactions += config.value.tps;
    }, 1000)

    const onChangeConfig = (newConfig) => {
      console.log('change config', newConfig)
      controller.setNodesScale(newConfig.nodeScale, 0);
      controller.autoGenerateTx(newConfig.tps)
      config.value.nodeScale = newConfig.nodeScale
      config.value.tps = newConfig.tps;
      config.value.swarmScale = newConfig.swarmScale
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
