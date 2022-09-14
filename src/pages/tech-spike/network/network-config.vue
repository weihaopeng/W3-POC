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
</template>

<script>
import { defineComponent, reactive, toRaw } from 'vue'

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
      onChangeConfig,
    }
  },
  async mounted() {},
})
</script>
