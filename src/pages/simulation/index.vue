<template lang="pug">
.simulation
  .simulation-header
    .simulation-header__title Two-stages Mint Simulation
    .simulation-header__operation
      AButton.play-btn(v-if="!manualMode && !playing"  shape="circle" @click="presentSimulate")
        template(#icon)
          img(:src="PlayPng")
      AButton.ant-btn-icon-only.stop-btn(v-else-if="!manualMode" @click="stopSimulate")
        template(#icon)
          img(:src="StopPng")
      AButton.clear-btn(shape="circle" @click="clearSwarmPainter")
        template(#icon)
          img(:src="ClearPng")

  .simulation-main
    .chain-container
      .chain-container__header chain
      .chain-block-card-list(ref="chainBlockList")
        BlockOrBpCard(v-for="block in chainBlocks" :data="block" :nodes="w3Nodes" :selectedBpI="selectedBpI" @unselect="handleUnselectBp" @select="handleSelectBlock(block)")

    .block-container
      .block-container__header block
      .block-card-list(ref="blockList")
        BlockOrBpCard(v-for="block in blocks" :data="block" :nodes="w3Nodes" :selectedBpI="selectedBpI" @unselect="handleUnselectBp" @select="handleSelectBlock(block)")
    
    .swarm-container
      .swarm-container__header
        .swarm-container__header-config Config: { NODES_AMOUNT: 5, COLLECTORS_AMOUNT: 1, WITNESSES_AMOUNT: 1, WITNESS_ROUNDS_AMOUNT: 2, TX_COUNT: 3 }
        ASteps(:percent="currentPercent * 33", :current="currentStep")
          AStep(title="Collecting Stage" disabled)
            template(#description)
              .swarm-step-description.highlight-green(v-if="currentStage" :class="{ highlight: currentStage === 'tx' }")
                span random collector: {{ collectorName }}, {{ Math.min(swarmRoundList.length, 3) }}/3 Txs
          AStep(title="Witness (BP) & Mint (Block)" disabled)
            template(#description)
              .swarm-step-description.highlight-orange(
                v-for="(bpRound, index) in swarmRoundList.slice(3)", :class="{ highlight: currentStage === `bp${index + 1}` || bpRound.type === 'block' }"
              )
                span(v-if="bpRound.type === 'bp'") Round {{ index + 1 }} random witness: {{ bpRound.witnessName }}
                span(v-else) Mint

      .swarm-container__content
        SwarmGraph(:nodes="w3Nodes" ref="swarmGraph" :playing="playing")
      
    .bp-container
      .bp-container__header bp
      .bp-card-list(ref="bpList")
        BlockOrBpCard(v-for="bp in bps" :nodes="w3Nodes" :data="bp" :selectedBpI="selectedBpI" @unselect="handleUnselectBp" @select="handleSelectBp(bp)")

    SimulationConfig(@start="startSimulate" @stop="stopSimulate")
</template>
  
<script>
import { defineComponent, onBeforeMount, onMounted, provide, ref } from 'vue'
import BlockOrBpCard from './components/block-or-bp-card.vue'
import SimulationConfig from './components/simulation-config.vue'
import SwarmGraph from './components/swarm-graph.vue'
import { useRoute } from 'vue-router'

import SwarmScript from './composition/swarm-script.js'
import { nodeMsgManager } from './composition/node-msg-manager.js'

import PlayPng from '@/assets/play.png'
import StopPng from '@/assets/stop.png'
import ClearPng from '@/assets/clear.png'

// import store from '@/store/w3.network.store.js'

const { addMsg, updateConfig, clearAll } = nodeMsgManager()

export default defineComponent({
  name: 'Simulation',
  components: { BlockOrBpCard, SimulationConfig, SwarmGraph },
  setup: () => {
    const swarmRoundList = ref([])
    const collectorName = ref('')
    const route = useRoute()
    const manualMode = ref(route.query.manual)
    const initHeight = Math.floor(Math.random() * 100)
    const playing = ref(false)
    const w3 = ref(null)
    const w3Nodes = ref([])

    const chainBlocks = ref([])
    const blocks = ref([])
    const bps = ref([])

    const currentPercent = ref(0)
    const currentStep = ref(0)
    const currentStage = ref('')

    const swarmGraph = ref(null)
    const selectedBpI = ref(-1)

    const chainBlockList = ref(null)
    const blockList = ref(null)
    const bpList = ref(null)

    const { swarmInit, mockBlockAndBp, swarmExecute } = SwarmScript(initHeight, w3, playing)

    // provide("w3.store", store)

    onBeforeMount(async () => {
      if (!manualMode.value) {
        const config = await swarmInit()
        // w3.value.reset()
        bindW3Listener(w3.value)
        const { NODES_AMOUNT, LATENCY_UPPER_BOUND, LOCAL_COMPUTATION_LATENCY, WITNESSES_AMOUNT, COLLECTORS_AMOUNT } = config
        updateConfig(NODES_AMOUNT, LATENCY_UPPER_BOUND, LOCAL_COMPUTATION_LATENCY, WITNESSES_AMOUNT, COLLECTORS_AMOUNT, true)
      }
    })

    onMounted(() => {
      scrollToBottom()
    })

    const scrollToBottom = () => {
      setTimeout(() => {
        if (chainBlockList.value) chainBlockList.value.scrollTop = 100000
        if (blockList.value) blockList.value.scrollTop = 100000
        if (bpList.value) bpList.value.scrollTop = 100000
      }, 0)
    }

    const addBpCard = (msg) => {
      // const data = msg.data
      bps.value.push(Object.assign({ type: 'bp', highlight: true }, msg))
      scrollToBottom()
    }

    const addBlockCard = (msg) => {
      blocks.value.push(Object.assign({ type: 'block', highlight: true }, msg))
      scrollToBottom()
    }

    const addChainBlockCard = (msg) => {
      chainBlocks.value.push(Object.assign({ type: 'chain', highlight: true }, msg))
      scrollToBottom()
    }

    const downplayBpCard = (msg) => {
      const bpI = msg.data.i
      const relatedBps = bps.value.filter((bp) => bp.data.i === bpI)
      for (const relatedBp of relatedBps) {
        relatedBp.highlight = false
      }
    }
    
    const downplayBlockCard = (msg) => {
      const blockI = msg.data.i
      const relatedBlocks = blocks.value.filter((block) => block.data.i === blockI)
      for (const relatedBlock of relatedBlocks) {
        relatedBlock.highlight = false
      }
    }

    const downplayChainBlockCard = (msg) => {
      const blockI = msg.data.i
      const relatedBlocks = blocks.value.filter((block) => block.data.i === blockI)
      for (const relatedBlock of relatedBlocks) {
        relatedBlock.highlight = false
      }
    }

    const getNodeLabelBy = (key, string) => {
      const index = w3Nodes.value.findIndex((node) => node[key] === string)
      return `No.${index + 1} ${w3Nodes.value[index].address.substring(0, 6)}`
    }

    const stepForward = (msg) => {
      if (msg.type === 'tx') {
        currentStage.value = 'tx'
        if (manualMode.value) return
        currentPercent.value ++
        swarmRoundList.value.push({})
        if (msg.role) {
          const collectorAddr = msg.to.address
          collectorName.value = getNodeLabelBy('address', collectorAddr)
        }
      } else if (msg.type === 'bp') {
        if (manualMode.value) {
          currentStage.value = 'bp1'
          return
        }
        const records = msg.data.witnessRecords
        const witnessAddr = msg.to.address
        const witnessName = getNodeLabelBy('address', witnessAddr)
        currentStage.value = `bp${records.length}`
        if (records.length <= 1) {
          currentPercent.value = 1
          currentStep.value = 1
        } else {
          if (!manualMode.value) currentPercent.value ++
        }
        swarmRoundList.value.push({ type: 'bp', witnessName })
      } else {
        currentStage.value = 'block'
        if (manualMode.value) return
        currentPercent.value ++
        swarmRoundList.value.push({ type: 'block' })
      }
    }

    const bindW3Listener = (swarm) => {
      swarm.on('swarm:init', async (msg) => {
        w3Nodes.value = msg.nodes
        const { mockChainBlocks, mockBlocks, mockBps } = await mockBlockAndBp()
        chainBlocks.value = mockChainBlocks
        blocks.value = mockBlocks
        bps.value = mockBps
        scrollToBottom()
      })
      swarm.events.on('network.msg.departure', (msg) => {
        console.log('!!!, departure', msg)
        addMsg(msg, 'network.msg.departure')
        // TODO: bp and block type, add to bp and block column
        if (msg.type === 'block') {
          addBlockCard(msg)
          stepForward(msg)
        }
      })
      swarm.events.on('network.msg.arrival', (msg) => {
        console.log('!!!, arrival', msg)
        addMsg(msg, 'network.msg.arrival')
        if (msg.role === 'witness') addBpCard(msg)
        if ((msg.type === 'tx' || msg.type === 'bp') && msg.role) stepForward(msg)
      })
      // swarm.events.on('node.role', (msg) => {
      //   addMsg(msg, 'node.role')
      //   if (msg.role === 'witness') addBpCard(msg)
      // })
      swarm.events.on('node.verify', (msg) => {
        console.log('!!!, verify', msg)
        addMsg(msg, 'node.verify')
        if (msg.type === 'bp') downplayBpCard(msg)
      })
      swarm.on('chain.block.added', (msg) => {
        console.log('!!!, add block', msg)
        addChainBlockCard(msg)
        downplayBlockCard(msg)
        if (manualMode.value) setTimeout(() => downplayChainBlockCard(msg), 2000)
      })
      swarm.events.on('chain.fork', (msg) => {
        console.log('!!!, fork chain', msg)
      })
    }

    const startSimulate = async (config) => {
      const { NODES_AMOUNT, LATENCY_UPPER_BOUND, LOCAL_COMPUTATION_LATENCY, WITNESSES_AMOUNT, COLLECTORS_AMOUNT } = config
      updateConfig(NODES_AMOUNT, LATENCY_UPPER_BOUND, LOCAL_COMPUTATION_LATENCY, WITNESSES_AMOUNT, COLLECTORS_AMOUNT, false)
      if (w3.value?.nodes) w3.value.destroy()
      w3.value = new W3Swarm(config)
      const txAmount = Math.ceil(2 * config.tps)
      await w3.value.init()
      bindW3Listener(w3.value)

      await w3.value.sendFakeTxs(txAmount, config.tps)
      w3.value.destroy()
      swarmGraph.value.reRender()
      stopSimulate()
    }

    const presentSimulate = async () => {
      await swarmExecute()
      swarmGraph.value.reRender()
      stopSimulate()
      // w3.value.destroy()
    }

    const stopSimulate = () => {
      playing.value = false
      // TODO
    }

    const clearSteps = () => {
      swarmRoundList.value = []
      currentPercent.value = 0
      currentStage.value = ''
      currentStep.value = 0
    }

    const clearSwarmPainter = () => {
      clearAll()
      chainBlocks.value.map((item) => item.highlight = false)
      clearSteps()
    }

    const handleSelectBlock = ({ data }) => {
      chainBlocks.value.map((item) => item.highlight = false)
      selectedBpI.value = data.bp.i
      customSwarmGarph(data.bp)
    }

    const handleSelectBp = ({ data }) => {
      chainBlocks.value.map((item) => item.highlight = false)
      selectedBpI.value = data.i
      const block = blocks.value.find((item) => item.data.bp.i === data.i)
      customSwarmGarph(block.data.bp)
    }

    const customSwarmGarph = (bp) => {
      swarmGraph.value.resetSwarm()
      swarmGraph.value.customRenderNode(bp.collector.i, 'Collector')
      for (let i = 0; i < bp.witnessRecords.length; i++) {
        swarmGraph.value.customRenderNode(bp.witnessRecords[i].witness.i, 'Witness', i + 1)
      }
    }

    const handleUnselectBp = () => {
      selectedBpI.value = -1
      swarmGraph.value.resetSwarm()
      clearSteps()
    }
    
    return {
      manualMode,
      swarmRoundList,
      collectorName,
      
      chainBlocks,
      blocks,
      bps,
      selectedBpI,
      
      PlayPng,
      StopPng,
      ClearPng,
      playing,

      currentPercent,
      currentStep,
      currentStage,
      w3Nodes,

      swarmGraph,

      chainBlockList,
      blockList,
      bpList,

      presentSimulate,

      startSimulate,
      stopSimulate,
      clearSwarmPainter,
      handleSelectBlock,
      handleSelectBp,
      handleUnselectBp
    }
  }
})
</script>
    
<style lang="scss" scoped>
@import './theme/antdv-inject.scss';
@import './theme/layout.scss';
.simulation {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 4px 30px 40px;
  &-header {
    color: #fff;
    font-size: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 16px 0;
    font-weight: 900;
    &__operation {
      position: absolute;
      right: 30px;
      .ant-btn {
        vertical-align: middle;
        margin-left: 24px;
      }
      .play-btn, .stop-btn, .clear-btn {
        border-width: 0;
        padding: 0;
        background: transparent;
        position: relative;
        img {
          width: 32px;
        }
        &::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          border-radius: 50%;
        }
        &:hover::after {
          background: rgba(255, 255, 255, 0.1);
        }
        &:active::after {
          background: rgba(0, 0, 0, 0.1);
        }
      }
    }
  }
  &-main {
    flex-grow: 1;
    display: flex;
    overflow: hidden;
  }
  .swarm-container {
    &__header {
      height: 160px;
      display: flex;
      flex-direction: column;
      align-items: center;
      &-config {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.5);
        margin: 15px 0 12px;
        text-align: center;
      }
    }
    &__content {
      flex-grow: 1;
    }
  }
}
.swarm-step-description {
  white-space: nowrap;
  span {
    margin-left: 4px;
  }
  &.highlight.highlight-green {
    font-weight: bolder;
    color: #1ACD57;
  }
  &.highlight.highlight-orange {
    font-weight: bolder;
    color: rgb(238, 140, 62);
  }
}
</style>