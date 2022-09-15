<template lang="pug">
AForm(:model="configData", :label-col="{ span: 24 }", :wrapper-col="{ span: 18 }")
  AFormItem(label="Node Scale")
    AInputNumber(v-model:value="configData.nodeScale" style="width: auto;" :formatter="numberFormatter")
  div Swarms: {{ swarmScale }}
  AFormItem(label="Latency In Swarm (ms)")
    AInputNumber(v-model:value="configData.latencyInSwarm" addon-after="ms" :formatter="numberFormatter")
  AFormItem(label="Latency Between Swarm")
    AInputNumber(v-model:value="configData.latencyBetweenSwarm" addon-after="ms" :formatter="numberFormatter")
  AFormItem(label="Throughput")
    AInputNumber(v-model:value="configData.tps" addon-after="TPS" :formatter="numberFormatter")
  AFormItem
    AButton(type="primary" html-type="submit" @click="onChangeConfig") Config

  ADivider(v-if="defaultConfig.isAttackSimulate")
  h3(v-if="defaultConfig.isAttackSimulate") Attack Simulation

  AFormItem(label="Attack Type" v-if="defaultConfig.isAttackSimulate")
    ASelect(ref="select", v-model:value="configData.attackType", :options="AttackTypeList")

  AFormItem(label="ForgeAccountRatio" v-if="defaultConfig.isAttackSimulate && configData.attackType === 'Sybil'")
    AInput(v-model:value="configData.forgeAccountRatio" type="number" suffix="%")

  AFormItem(label="Attacked Node" v-if="defaultConfig.isAttackSimulate && configData.attackType === 'Finney'")
    ASelect(ref="select" value="node1" :options="FinneyAttackNodeList")

  AFormItem(label="Attacked Swarm" v-if="defaultConfig.isAttackSimulate && configData.attackType === 'Eclipse'")
    ASelect(ref="select" value="swarm1" :options="EclipseNodeList")
  
  AFormItem(v-if="defaultConfig.isAttackSimulate")
    AButton(type="primary" html-type="submit" @click="onSimulateSwitch") {{ simulateButtonName }}
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
  emits: ['changeConfig'],
  props: ['defaultConfig'],
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
      emit('changeConfig', {startAttackSimulate: configData.startAttackSimulate})
    }

    const numberFormatter = (value) => {
      return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

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
