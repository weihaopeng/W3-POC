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
        BlockOrBpCard(v-for="block in chainBlocks" :data="block" :nodes="w3Nodes" @click="handleSelectBlock")

    .block-container
      .block-container__header block
      .block-card-list(ref="blockList")
        BlockOrBpCard(v-for="block in blocks" :data="block" :nodes="w3Nodes" @click="handleSelectBlock")
    
    .swarm-container
      .swarm-container__header
        .swarm-container__header-config Config: { NODES_AMOUNT: 5, COLLECTORS_AMOUNT: 1, WITNESSES_AMOUNT: 1, WITNESS_ROUNDS_AMOUNT: 2, TX_COUNT: 3 }
        ASteps(v-if="!manualMode" :percent="currentPercent * 33", :current="currentStep")
          AStep(title="Collecting Stage" disabled)
            template(#description)
              .swarm-step-description.highlight-green(v-if="currentStage" :class="{ highlight: currentStage === 'tx' }")
                span random collector: {{ collectorName }}, {{ Math.min(swarmRoundList.length, 3) }}/3 Txs
          AStep(title="Witness (BP) & Mint (Block)" disabled)
            template(#description)
              .swarm-step-description.highlight-orange(
                v-for="(bpRound, index) in swarmRoundList", :class="{ highlight: currentStage === `bp${index + 1}` || bpRound.type === 'block' }"
              )
                span(v-if="bpRound.type === 'bp'") Round {{ index + 1 }} random witness: {{ bpRound.witnessName }}
                span(v-else) Mint

      .swarm-container__content
        SwarmGraph(:nodes="w3Nodes" ref="swarmGraph" :playing="playing")
      
    .bp-container
      .bp-container__header bp
      .bp-card-list(ref="bpList")
        BlockOrBpCard(v-for="bp in bps" :nodes="w3Nodes" :data="bp" @click="handleSelectBp")

    SimulationConfig(@start="startSimulate" @stop="stopSimulate")
</template>
  
<script>
import { defineComponent, onBeforeMount, onMounted, ref } from 'vue'
import BlockOrBpCard from './components/block-or-bp-card.vue'
import SimulationConfig from './components/simulation-config.vue'
import SwarmGraph from './components/swarm-graph.vue'
import { useRoute } from 'vue-router'

import SwarmScript from './composition/swarm-script.js'
import { nodeMsgManager } from './composition/node-msg-manager.js'

import dayjs from 'dayjs'
import PlayPng from '@/assets/play.png'
import StopPng from '@/assets/stop.png'
import ClearPng from '@/assets/clear.png'

// import nodes from './swarm/assets/nodes.json'
// import MessageHandler from './swarm/MessageHandler.js'
// import SwarmPainter from './swarm/painter/SwarmPainter.js'

const { addMsg, updateConfig } = nodeMsgManager()

export default defineComponent({
  name: 'Simulation',
  components: { BlockOrBpCard, SimulationConfig, SwarmGraph },
  setup: () => {
    const swarmRoundList = ref([])
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

    const { swarmInit, swarmExecute } = SwarmScript(initHeight, w3, playing)

    // const { addMsg, updateConfig } = NodeMsgManager()


    onBeforeMount(async () => {
      if (!manualMode.value) {
        const config = await swarmInit()
        bindW3Listener()
        const { NODES_AMOUNT, LATENCY_UPPER_BOUND, LOCAL_COMPUTATION_LATENCY, WITNESSES_AMOUNT, COLLECTORS_AMOUNT } = config
        updateConfig(NODES_AMOUNT, LATENCY_UPPER_BOUND, LOCAL_COMPUTATION_LATENCY, WITNESSES_AMOUNT, COLLECTORS_AMOUNT)
      }
    })

    const initHistoryData = () => {

    }

    const addBpCard = (msg) => {
      // const data = msg.data
      bps.value.push(Object.assign({ type: 'bp', highlight: true }, msg))
    }

    const addBlockCard = (msg) => {
      blocks.value.push(Object.assign({ type: 'block', highlight: true }, msg))
    }

    const addChainBlockCard = (msg) => {
      chainBlocks.value.push(Object.assign({ type: 'chain', highlight: true }, msg))
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

    const bindW3Listener = () => {
      w3.value.events.on('simulation.init', (msg) => {
        w3Nodes.value = msg.nodes
        initHistoryData()
        // TODO: add nodes, init swarm graph; init block, bp history data.
      })
      w3.value.events.on('network.msg.departure', (msg) => {
        console.log('!!!, departure', msg)
        const notAutoRemove = !manualMode.value && msg.type === 'block'
        addMsg(msg, 'network.msg.departure', !notAutoRemove)
        // TODO: bp and block type, add to bp and block column
        if (msg.type === 'block') addBlockCard(msg)
      })
      w3.value.events.on('network.msg.arrival', (msg) => {
        console.log('!!!, arrival', msg)
        addMsg(msg, 'network.msg.arrival')
      })
      w3.value.events.on('node.role', (msg) => {
        addMsg(msg, 'node.role')
        if (msg.role === 'witness') addBpCard(msg)
      })
      w3.value.events.on('node.verify', (msg) => {
        console.log('!!!, verify', msg)
        const autoDownplay = manualMode.value || msg.type !== 'block'
        addMsg(msg, 'node.verify', autoDownplay)
        if (msg.type === 'bp') downplayBpCard(msg)
      })
      w3.value.events.on('chain.block.added', (msg) => {
        console.log('!!!, add block', msg)
        addChainBlockCard(msg)
        downplayBlockCard(msg)
        if (manualMode.value) setTimeout(() => downplayChainBlockCard(msg), 2000)
      })
      w3.value.events.on('chain.fork', (msg) => {
        console.log('!!!, fork chain', msg)
      })
    }

    const startSimulate = async (config) => {
      const { NODES_AMOUNT, LATENCY_UPPER_BOUND, LOCAL_COMPUTATION_LATENCY, WITNESSES_AMOUNT, COLLECTORS_AMOUNT } = config
      updateConfig(NODES_AMOUNT, LATENCY_UPPER_BOUND, LOCAL_COMPUTATION_LATENCY, WITNESSES_AMOUNT, COLLECTORS_AMOUNT)
      if (w3.value?.nodes) w3.value.destroy()
      w3.value = new W3Swarm(config)
      const txAmount = Math.ceil(2 * config.tps)
      await w3.value.init()
      console.log('w3 swarm', w3.value, txAmount, config.tps)
      bindW3Listener()

      await w3.value.sendFakeTxs(txAmount, config.tps)
      w3.value.destroy()
      swarmGraph.value.reDrawNode()
      stopSimulate()
    }

    const presentSimulate = async () => {
      await swarmExecute()
      swarmGraph.value.reDrawNode()
      stopSimulate()
      // w3.value.destroy()
    }

    const stopSimulate = () => {
      playing.value = false
      // TODO
    }

    const clearSwarmPainter = () => {

    }

    const handleSelectBlock = () => {

    }

    const handleSelectBp = () => {

    }
    
    return {
      manualMode,
      swarmRoundList,
      
      chainBlocks,
      blocks,
      bps,
      
      PlayPng,
      StopPng,
      ClearPng,
      playing,

      currentPercent,
      currentStep,
      currentStage,
      w3Nodes,

      swarmGraph,
      presentSimulate,

      startSimulate,
      stopSimulate,
      clearSwarmPainter,
      handleSelectBlock,
      handleSelectBp
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