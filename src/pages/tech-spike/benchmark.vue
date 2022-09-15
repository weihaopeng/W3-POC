<template lang="pug">
#benchmark-main
  #config-button
    AButton(@click="showConfig")
      template(#icon)
        SettingOutlined
      | config
  BenchmarkHeader#benchmark-header(:chain-height="config.chainHeight" :total-transactions="config.totalTransactions")
  WorldMap#benchmark-map(:config="config")
  Performance#benchmark-performance(:performance-visible="visible.performance" @close="closePerformance" :config="config")
  Resource#benchmark-resource(:resource-visible="visible.resource" @close="closeResource" :config="config")

ADrawer(title="W3 Network Configuration" v-model:visible="configVisible" placement="left" @close="onConfigClose")
  NetworkConfig(:default-config="config" @change-config="onChangeConfig")
</template>

<script>
import { defineComponent, ref, watch, toRaw } from 'vue'
import WorldMap from '@/pages/tech-spike/network/world-map.vue'
import Performance from '@/pages/tech-spike/network/performance.vue'
import Resource from '@/pages/tech-spike/network/resource.vue'
import NetworkConfig from '@/pages/tech-spike/network/network-config.vue'
import controller from '@/pages/tech-spike/network/controller.js'
import BenchmarkHeader from '@/pages/tech-spike/network/benchmark-header.vue'
import { SettingOutlined } from '@ant-design/icons-vue'
import { useRoute } from 'vue-router'
import { isNil } from 'lodash'

export default defineComponent({
  name: 'Benchmark',
  components: {
    WorldMap,
    Performance,
    Resource,
    NetworkConfig,
    BenchmarkHeader,
    SettingOutlined
  },

  setup: () => {
    const configVisible = ref(false)
    const visible = ref({
      performance: false,
      resource: false
    })

    const config = ref({
      nodeScale: 1000,
      latencyInSwarm: 20,
      latencyBetweenSwarm: 100,
      tps: 15,
      swarmScale: 1,
      attackType: 'Sybil',
      forgeAccountRatio: 30,
      chainHeight: 181311,
      totalTransactions: 103123414,
      isAttackSimulate: false,
      startAttackSimulate: false,
    })

    const route = useRoute();
    watch(() => route.name, (newRouteName) => {
      config.value.isAttackSimulate = newRouteName === 'security'
      if (!config.value.isAttackSimulate) {
        config.value.startAttackSimulate = false
      }
      onChangeConfig(toRaw(config.value))
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

    setInterval(() => {
      config.value.chainHeight += config.value.tps / (40 + 10 * Math.random())
      config.value.totalTransactions += config.value.tps
    }, 1000)

    if (config.value.isAttackSimulate) {
      const attackerNodeScale = Math.floor(config.value.nodeScale * config.value.forgeAccountRatio / 100)
      controller.setNodesScale(config.value.nodeScale - attackerNodeScale,  attackerNodeScale)
    } else {
      controller.setNodesScale(config.value.nodeScale,  0)
    }
    controller.autoGenerateTx(config.value.tps)

    const onChangeConfig = (newConfig) => {
      console.log('change config', newConfig)
      configVisible.value = false;
      if (newConfig.tps)
        controller.autoGenerateTx(newConfig.tps);

      newConfig.nodeScale && (config.value.nodeScale = newConfig.nodeScale);
      if (newConfig.tps) {
        config.value.tps = newConfig.tps
        config.value.swarmScale = Math.ceil(newConfig.nodeScale / (150 + Math.random() * 50))
      }
      if (!isNil(newConfig.isAttackSimulate))
        config.value.isAttackSimulate = newConfig.isAttackSimulate;
      if (!isNil(newConfig.startAttackSimulate))
        config.value.startAttackSimulate = newConfig.startAttackSimulate;
      if (newConfig.forgeAccountRatio)
        config.value.forgeAccountRatio = newConfig.forgeAccountRatio;
      
      if (!isNil(newConfig.startAttackSimulate)) {
        if (config.value.startAttackSimulate === true) {
          const attackerNodeScale = Math.floor(config.value.nodeScale * config.value.forgeAccountRatio / 100);
          controller.setNodesScale(config.value.nodeScale - attackerNodeScale, attackerNodeScale);
        } else {
          controller.setNodesScale(config.value.nodeScale, 0);
        }
      }
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

<style scoped lang="scss">
  #benchmark-main {
    background-color: rgb(56, 59, 85);
    width: 100%;
    height: 100%;
    border-radius: 10px;
    #benchmark-header {
      display: flex;
      width: 54%;
      height: 7%;
      background-color: #FFFFFF;
      position: relative;
      left: 1.5%;
      top: 1%;
      z-index: 1;
    }
    #config-button {
      position: absolute;
      top: 85%;
      z-index: 1;
    }
    #benchmark-map {
      width: 54%;
      height: 65%;
      position: relative;
      top: 6%;
      left: 1.5%;
    }
    #benchmark-performance {
      height: 41%;
      width: 40%;
      position: relative;
      top: -71%;
      left: 58%
    }
    
    #benchmark-resource {
      height: 41%;
      width: 40%;
      position: relative;
      top: -69%;
      left: 58%
    }
  }
</style>
