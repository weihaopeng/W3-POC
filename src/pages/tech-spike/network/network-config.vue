<template lang="pug">
AForm(:model="configData", :label-col="{ span: 24 }", :wrapper-col="{ span: 16 }")
  AFormItem(label="Node Scale")
    AInput(v-model:value="configData.nodeScale" type="number")
  AFormItem(label="Latency In Swarm")
    AInput(v-model:value="configData.latencyInSwarm" type="number")
  AFormItem(label="Latency Between Swarm")
    AInput(v-model:value="configData.latencyBetweenSwarm" type="number")
  AFormItem(label="TPS")
    AInput(v-model:value="configData.tps" type="number")
  AFormItem
    AButton(type="primary" html-type="submit" @click="onChangeConfig") Config
  
  AFormItem(label="Attack Type" v-if="defaultConfig.attackType")
    ASelect(ref="select", v-model:value="configData.attackType", :options="AttackTypeList")
  AFormItem(label="ForgeAccountRatio(%)" v-if="defaultConfig.attackType")
    AInput(v-model:value="configData.forgeAccountRatio" type="number")

</template>

<script>
import { defineComponent, reactive, toRaw } from 'vue'
const AttackTypeList = [
  { value: 'Finney', label: 'Finney(race)' },
  { value: 'Eclipse', label: 'Eclipse' },
  { value: 'Sybil', label: 'Sybil' },
  { value: 'DDos', label: 'DDos', disabled: true },
  { value: 'routing', label: 'routing', disabled: true },
  { value: 'DAO', label: 'DAO', disabled: true },
  { value: 'parityMultising', label: 'parityMultising', disabled: true }
]

export default defineComponent({
  name: 'NetworkConfig',
  emits: ['changeConfig'],
  props: ['defaultConfig'],
  setup: (props, { emit }) => {
    const configData = reactive(props.defaultConfig)

    const onChangeConfig = () => {
      emit('changeConfig', toRaw(configData))
    }

    return {
      configData,
      AttackTypeList,
      onChangeConfig
    }
  }
})
</script>
