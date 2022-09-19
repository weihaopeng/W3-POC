<template lang="pug">
.network
  .network-map-container
    ChainInfo.network-map-header(:chain-height="config.chainHeight" :total-transactions="config.totalTransactions")
    WorldMap.network-map-cvs(:config="config")
  .network-line-charts-group
    Performance.network-performance(:performance-visible="visible.performance" @close="closePerformance" :config="config")
    Resource.network-resource(:resource-visible="visible.resource" @close="closeResource" :config="config")

  .config-button
    AButton(@click="showConfig" size="large")
      template(#icon)
        SettingOutlined
      | Config

ADrawer.network-config-drawer(title="W3 Network Configuration" v-model:visible="configVisible" placement="left" @close="onConfigClose")
  NetworkConfig(:default-config="config" @change-config="onChangeConfig" @changeForgeAccountRatio="onChangeForgeAccountRatio")
</template>

<script>
import { defineComponent, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue'
import WorldMap from '@/pages/tech-spike/network/world-map.vue'
import Performance from '@/pages/tech-spike/network/performance.vue'
import Resource from '@/pages/tech-spike/network/resource.vue'
import NetworkConfig from '@/pages/tech-spike/network/network-config.vue'
import controller from '@/pages/tech-spike/network/controller.js'
import ChainInfo from '@/pages/tech-spike/network/chain-info.vue'
import { SettingOutlined } from '@ant-design/icons-vue'
import { useRoute } from 'vue-router'
import { isNil } from 'lodash'

export default defineComponent({
  name: 'Network',
  components: {
    WorldMap,
    Performance,
    Resource,
    NetworkConfig,
    ChainInfo,
    SettingOutlined
  },

  setup: () => {
    const configVisible = ref(false)
    const visible = ref({
      performance: false,
      resource: false
    })

    const route = useRoute();
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
      isAttackSimulate: route.name === 'security',
      startAttackSimulate: false,
      playing: true
    })

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
      if(config.value.playing) {
        config.value.chainHeight += config.value.tps / (40 + 10 * Math.random())
        config.value.totalTransactions += config.value.tps
      }
    }, 1000)

    if (config.value.isAttackSimulate && config.value.startAttackSimulate) {
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
        if (config.value.startAttackSimulate) {
          const attackerNodeScale = Math.floor(config.value.nodeScale * config.value.forgeAccountRatio / 100);
          controller.setNodesScale(config.value.nodeScale - attackerNodeScale, attackerNodeScale);
        } else {
          controller.setNodesScale(config.value.nodeScale, 0);
        }
      }
    }

    const onChangeForgeAccountRatio = (forgeAccountRatio) => {
      config.value.forgeAccountRatio = forgeAccountRatio;
      if (config.value.startAttackSimulate) {
        const attackerNodeScale = Math.floor(config.value.nodeScale * config.value.forgeAccountRatio / 100);
        controller.setNodesScale(config.value.nodeScale-attackerNodeScale, attackerNodeScale);
      }
    }

    const onKeydown = (event) => {
      if (event.key === 'p') {
        config.value.playing = !config.value.playing
        if (config.value.playing) controller.play()
        else controller.pause()
      }
    }

    onMounted(() => {
      document.addEventListener('keydown', onKeydown)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', onKeydown)
    })

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
      onChangeForgeAccountRatio
    }
  },
})
</script>

<style scoped lang="scss">
  .network {
    width: 100%;
    height: 100%;
    display: flex;
    padding: 20px 20px 40px 30px;
    &-map-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      .network-map-header {
        display: flex;
        width: 100%;
        height: 6.7vh;
        display: flex;
        background-color: #FFFFFF;
        position: relative;
      }
      .network-map-cvs {
        width: 100%;
        flex-grow: 1;
      }
    }
    &-line-charts-group {
      width: 40vw;
      height: 100%;
      margin-left: 1.5vw;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      .network-performance, .network-resource {
        width: 100%;
        height: calc(50% - 1.25vh);
      }
    }
    .config-button {
      position: absolute;
      top: 85%;
      left: 0;
      .ant-btn {
        border-radius: 0 4px 4px 0;
        border-left: none;
        &:hover {
          border-color: #3C7BFD;
          color: #3C7BFD;
        }
      }
    }
  }
</style>

<style lang="scss">
.network-config-drawer {
  .ant-drawer-header {
    height: 90px;
  }
  .ant-drawer-content-wrapper {
    width: 400px !important;
  }
  .ant-drawer-body {
    padding: 12px 30px;
    .ant-form-item-label {
      padding-bottom: 2px;
    }
  }
  .ant-drawer-title {
    font-size: 24px;
    font-weight: 600;
    white-space: nowrap;
  }
}
</style>