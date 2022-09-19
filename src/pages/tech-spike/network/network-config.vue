<template lang="pug">
AForm.network-config-form(:model="configData", :label-col="{ span: 24 }", :wrapper-col="{ span: 18 }")
  AFormItem(label="Node Scale")
    AInputNumber(v-model:value="configData.nodeScale" style="width: auto;" :formatter="numberFormatter")
  AFormItem.no-control(:label="`Swarms: ${swarmScale}`")
  AFormItem(label="Latency In Swarm (ms)")
    AInputNumber(v-model:value="configData.latencyInSwarm" addon-after="ms" :formatter="numberFormatter")
  AFormItem(label="Latency Between Swarm")
    AInputNumber(v-model:value="configData.latencyBetweenSwarm" addon-after="ms" :formatter="numberFormatter")
  AFormItem(label="Throughput")
    AInputNumber(v-model:value="configData.tps" addon-after="TPS" :formatter="numberFormatter")
  AFormItem
    AButton(type="primary" html-type="submit" @click="onChangeConfig" size="large") Config

  ADivider(v-if="defaultConfig.isAttackSimulate")
  h3(v-if="defaultConfig.isAttackSimulate") Attack Simulation

  AFormItem(label="Attack Type" v-if="defaultConfig.isAttackSimulate")
    ASelect(ref="select", v-model:value="configData.attackType", :options="AttackTypeList")

  AFormItem(label="ForgeAccountRatio" v-if="defaultConfig.isAttackSimulate && configData.attackType === 'Sybil'")
    AInputNumber(v-model:value="configData.forgeAccountRatio" addon-after="%")

  AFormItem(label="Attacked Node" v-if="defaultConfig.isAttackSimulate && configData.attackType === 'Finney'")
    ASelect(ref="select" value="node1" :options="FinneyAttackNodeList")

  AFormItem(label="Attacked Swarm" v-if="defaultConfig.isAttackSimulate && configData.attackType === 'Eclipse'")
    ASelect(ref="select" value="swarm1" :options="EclipseNodeList")
  
  AFormItem(v-if="defaultConfig.isAttackSimulate")
    AButton(type="primary" html-type="submit" @click="onSimulateSwitch" size="large") {{ simulateButtonName }}
</template>

<script>
import { defineComponent, reactive, toRaw, computed, watch } from 'vue'
const AttackTypeList = [
  { value: 'Finney', label: 'Finney(race)' },
  { value: 'Eclipse', label: 'Eclipse' },
  { value: 'Sybil', label: 'Sybil' },
  { value: 'DDos', label: 'DDos', disabled: true },
  { value: 'routing', label: 'routing', disabled: true },
  { value: 'DAO', label: 'DAO', disabled: true },
  { value: 'parityMultising', label: 'parityMultising', disabled: true }
]
const FinneyAttackNodeList = [
  { value: 'node1', label: 'NxfiHffwafewzooiweifpoiewqfweoi' },
  { value: 'node2', label: 'Lfoiwqfqwjfiopqjfowjqfnvoqwfwf' },
  { value: 'node3', label: 'mopfqwnwefFOIWOWEIjfoqnwffnqwof' },
  { value: 'node4', label: 'fawefwofewfnawoovneifjweofawef' },
  { value: 'node5', label: 'fwefwoepfjoweajfwefmwoefw' }
]
const EclipseNodeList = [
  { value: 'swarm1' },
  { value: 'swarm2' },
  { value: 'swarm3' },
  { value: 'swarm4' },
  { value: 'swarm5' },
]

export default defineComponent({
  name: 'NetworkConfig',
  emits: ['changeConfig', 'changeForgeAccountRatio'],
  props: {
    defaultConfig: Object
  },
  setup: (props, { emit }) => {
    const configData = reactive({
      ...props.defaultConfig,
      swarmScale: 1
    })

    const swarmScale = computed(() => {
      return Math.ceil(configData.nodeScale / (50 + Math.random() * 50))
    })

     watch(() => props.defaultConfig.startAttackSimulate, () => {
      configData.startAttackSimulate = props.defaultConfig.startAttackSimulate
    })

    const onChangeConfig = () => {
      configData.swarmScale = swarmScale
      emit('changeConfig', toRaw(configData))
    }

    const simulateButtonName = computed(() => {
      return configData.startAttackSimulate ? 'Stop' : 'Start'
    })

    const onSimulateSwitch = () => {
      configData.startAttackSimulate = !configData.startAttackSimulate;
      emit('changeConfig', { startAttackSimulate: configData.startAttackSimulate, forgeAccountRatio: configData.forgeAccountRatio })
    }

    const numberFormatter = (value) => {
      return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    watch(() => configData.forgeAccountRatio, () => {
      emit('changeForgeAccountRatio', configData.forgeAccountRatio)
    })

    return {
      configData,
      swarmScale,
      AttackTypeList,
      FinneyAttackNodeList,
      EclipseNodeList,
      simulateButtonName,
      onChangeConfig,
      onSimulateSwitch,
      numberFormatter
    }
  }
})
</script>

<style lang="scss" scoped>
.network-config-form {
  margin-top: -2px;
  .ant-form-item {
    margin-bottom: 28px;
    :deep .ant-form-item-label > label {
      font-size: 20px;
      margin: 0px 0 -4px;
    }
    .ant-input-number {
      font-size: 16px;
      width: 208px;
    }
    :deep .ant-input-number-group {
      width: 240px;
      .ant-input-number {
        width: 100%;
      }
      .ant-input-number-group-addon {
        padding: 0 5px;
      }
    }
    &.no-control {
      margin-bottom: 36px;
    }

    .ant-btn {
      margin-top: 18px;
      background: #3C7BFD;
      border-radius: 4px;
      min-width: 110px;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ant-select {
      width: 240px;
    }
  }

  h3 {
    font-size: 20px;
    font-weight: 900;
    margin-bottom: 22px;
  }

  .ant-divider {
    margin: 24px -24px 42px;
    width: calc(100% + 48px);
  }
}

</style>