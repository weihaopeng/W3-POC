<template lang="pug">
.swarm
  .swarm-title
    h1 Two-stages Mint Simulation
    div(v-if="route.query.present", style="color: #666; height: 40px; display: flex; align-items: center;")
      span Config: { NODES_AMOUNT: 5, COLLECTORS_AMOUNT: 1, WITNESSES_AMOUNT: 1, WITNESS_ROUNDS_AMOUNT: 2, TX_COUNT: 3 }
      AButton(v-if="!presenting" type="link" size="large" @click="simulate")
        template(#icon)
          PlayCircleOutlined
      AButton.ant-btn-icon-only.stop-btn(v-else type="link" size="large" @click="stopSimulate")
        .stop-btn__icon
          .stop-btn__icon-inner
      AButton(type="primary" @click="clearSwarm") Clear Swarm
    ASteps(:precent="currentPrecent", :current="currentStep")
      AStep(title="Collecting Stage")
        template(#description)
          .swarm-step-description.highlight-green(v-if="currentStage" :class="{ highlight: currentStage === 'tx' }")
            span random collector: {{ collectorName }}
            span.highlight-point {{ txRoundList.length }}/3
            span Txs
      AStep(title="Witness(BP) & Mint(Block)")
        template(#description)
          .swarm-step-description.highlight-orange(v-for="(bpRound, index) in bpRoundList", :class="{ highlight: currentStage === `bp${index + 1}` || bpRound.type === 'block' }")
            div(v-if="bpRound.type === 'bp'")
              span Round
              span.highlight-point {{ index + 1 }}
              span random witness: 
              span.highlight-point {{ bpRound.witnessName }}
            span.highlight-point(v-else) Mint

  .swarm-main
    .chain-column
      h1 chain
      #chain-container(ref="chainContainer")
        .chain-container(v-for="block in chainBlockList" :class="{ highlight: block.highlight, selected: block.roundId === selectedRound }" @click="highlightBlockOrBp(block)")
          .block-info
            div(style="max-width: 210px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;") {{ block.data.block.block.hash }}
            div Height: {{ block.data.block.block.height }}
            div Tx Count: {{ block.data.txCount }}
          .node-info
            div
              span Nodes: 
              span.node-info__link(v-for="(i, index) in new Array(block.data.participantsCount)") {{ index === 0 ? 'C' : `W${ index }` }}
              //- div Nodes: 
              //- span.node-info__link(v-for="(i, index) in new Array(block.data.participantsCount)") {{ index === 0 ? 'Collector' : `R${ index } Witness` }}
            div Addr: {{ block.data.block.node.address }}

    .block-column
      h1 block
      #block-container(ref="blockContainer")
        .block-container(v-for="block in blockList" :class="{ highlight: block.highlight, selected: block.roundId === selectedRound }" @click="highlightBlockOrBp(block)")
          .block-info
            div(style="max-width: 210px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;") {{ block.data.block.hash }}
            div Height: {{ block.data.block.height }}
            div Tx Count: {{ block.data.txCount }}
          .node-info
            span Nodes: 
            span.node-info__link(v-for="(i, index) in new Array(block.data.participantsCount)") {{ index === 0 ? 'C' : `W${ index }` }}
            //- div Nodes: 
            //- span.node-info__link(v-for="(i, index) in new Array(block.data.participantsCount)") {{ index === 0 ? 'Collector' : `R${ index } Witness` }}
            div Addr: {{ block.data.node.address }}

    .swarm-column
      h1 swarm
      .swarm-cvs-container
        #swarm-node-cvs
        #swarm-tooltip-container
          .swarm-tooltip-legend
            div Legend
            div TX → Transaction
            div BP → Block Proposal
            div Bk → Block
            div Fk → Chain forked
      
    .bp-column
      h1 bp
      #bp-container(ref="bpContainer")
        .bp-container(v-for="(bp, bpIndex) in bpList" :class="{ highlight: bp.highlight, selected: bp.roundId === selectedRound }" @click="highlightBlockOrBp(bp)")
          span Witness Round{{ bp.data.round }}
          div Bp At: {{ bp.data.bpTime }}
          div Witness At: {{ bp.data.witnessTime }}
          .bp-node(
            v-for="(node, index) in bp.data.nodes",
            :style="{ color: bpIndex === bpList.length - 1 && bpRoundList.length === bpList.length && index === bp.data.nodes.length - 1 ? '#1890ff' : '#000' }"
          )
            span {{ index === 0 ? 'Collector' : `Witness${index}` }}: 
            span(style="margin-left: 4px;") {{ node.name }}

    ControlSimulator(ref="ControlSimulatorComp" :currentBlockH="currentBlockHeight" @sendMsg="handleMsg" @startPresent="startPresent" @endPresent="endPresent")
</template>

<script>
import { defineComponent, onBeforeMount, onMounted, ref } from 'vue'
import ControlSimulator from './swarm/control-simulator.vue'
import { useRoute } from 'vue-router'
import { getRandomIp, getRandomHash } from './util.js'
import dayjs from 'dayjs'
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons-vue'

import nodes from './swarm/assets/nodes.json'
import MessageHandler from './swarm/MessageHandler.js'
import SwarmPainter from './swarm/painter/SwarmPainter.js'

export default defineComponent({
  name: 'Swarm',
  components: { PlayCircleOutlined, PauseCircleOutlined, ControlSimulator },
  setup: () => {
    const chainBlockList = ref([])
    const blockList = ref([])
    const bpList = ref([])
    const bpRoundList = ref([])
    const collectorName = ref('No.4')
    const currentPrecent = ref(0)
    const currentStep = ref(0)
    const currentStage = ref('')
    const txRoundList = ref([])
    const route = useRoute()
    const currentBlockHeight = ref(Math.ceil(Math.random() * 100))

    const bpContainer = ref(null)
    const blockContainer = ref(null)
    const chainContainer = ref(null)

    const swarmPainter = ref(null)
    const messageHandler = ref(null)

    const presenting = ref(false)
    const ControlSimulatorComp = ref(null)

    const selectedRound = ref('')

    const mockBlockInfo = (ifAddToChain) => {
      const address = getRandomIp()
      if (ifAddToChain) currentBlockHeight.value++
      return {
        node: { address, i: Math.floor(Math.random() * 1000) },
        block: { height: currentBlockHeight.value, hash: getRandomHash(), i: Math.floor(Math.random() * 1000) }
      }
    }

    const mockData = () => {
      const mockRound = Math.random() * 10 + 20
      for (let i = 0; i < mockRound; i++) {
        const roundId = getRandomHash()
        const ifAddToChain = i === mockRound - 1 || Math.random() < 0.6
        const obj = { data: mockBlockInfo(ifAddToChain), roundId }
        obj.data.txCount = 3,
        obj.data.participantsCount = 3
        blockList.value.push(obj)
        if(ifAddToChain) {
          chainBlockList.value.push({
            data: {
              block: obj.data,
              txCount: obj.data.txCount,
              participantsCount: obj.data.participantsCount
            },
            roundId
          })
        }

        const minuteAgo = Math.floor(Math.random() * 20) + i * 20
        const randomMs = Math.floor(Math.random() * 10000)
        const baseTime = dayjs().subtract(minuteAgo * 60000 + randomMs, 'millisecond')
        const noIndex = Math.floor(Math.random() * 5);
        const participantsNodes = nodes.filter((node, index) => index !== noIndex)
        participantsNodes.sort(() => (Math.random() - 0.5))
        for (let round = 0; round < 2; round++) {
          bpList.value.push({
            data: {
              nodes: participantsNodes.filter((node, index) => index <= round + 1),
              bpTime: baseTime.add(round * 3000 + Math.floor(Math.random() * 1000), 'millisecond').format('YYYY/MM/DD HH:mm:ss:SSS'),
              witnessTime: baseTime.add((round + 1) * 3000 + Math.floor(Math.random() * 1000), 'millisecond').format('YYYY/MM/DD HH:mm:ss:SSS'),
              round: round + 1
            },
            roundId
          })
        }
      }
    }

    onBeforeMount(() => mockData())

    onMounted(() => {
      swarmPainter.value = new SwarmPainter(document.getElementById('swarm-node-cvs'), document.getElementById('swarm-tooltip-container'), nodes)
      swarmPainter.value.init(!route.query.present)
      messageHandler.value = new MessageHandler({
        swarmPainter: swarmPainter.value,
        nodes
      })
      scrollToBottom()
    })

    const scrollToBottom = () => {
      bpContainer.value.scrollTop = 1000000
      blockContainer.value.scrollTop = 1000000
      chainContainer.value.scrollTop = 1000000
    }

    const startPresent = () => {
      presenting.value = true
    }

    const endPresent = () => {
      presenting.value = false
    }

    const handleMsg = (fn, ...args) => {
      messageHandler.value[fn](...args)
      if (fn === 'setRoles' || fn === 'clearRoles') return
      if (presenting.value) analysisCurrentStage(...args)
      if (fn === 'handleBlockOnChain') handleChainMsg(...args)
      if (fn !== 'handleNodeVerify') handleBpAndBlockMsg(...args)
      setTimeout(() => {
        scrollToBottom()
      }, 0)
    }

    const handleChainMsg = (msg) => {
      msg.highlight = true
      chainBlockList.value.push(msg)
      setTimeout(() => {
        msg.highlight = false
      }, 2000)
    }

    const handleBpAndBlockMsg = (msg, action) => {
      if (msg.type === 'bp') {
        console.log('append bp', msg, action)
        if (action === 'departure' && msg.data.isWitness) {
          msg.highlight = true
          bpList.value.push(msg)
        } else if (action === 'arrive') {
          const departureMsg = bpList.value.find((item) => item.sessionId === msg.sessionId)
          if (departureMsg) {
            setTimeout(() => {
              departureMsg.highlight = false
            }, 2000)
          }
        }
      } else if (action === 'departure' && msg.type === 'block') {
        if (blockList.value.find((item) => item.data.block.hash === msg.data.block.hash)) return
        msg.highlight = true
        blockList.value.push(msg)
        setTimeout(() => {
          msg.highlight = false
        }, 2000)
      }
    }

    const analysisCurrentStage = (...args) => {
      console.log('stage', args)
      const type = args[0].type
      const sessionId = args[0].sessionId
      const isWitness = args[0].data.isWitness
      const toNodeId = args[0].to?.address
      const action = args[1]
      if (!currentStage.value) currentStage.value = 'tx'
      if (type === 'tx' && action === 'departure' && !txRoundList.value.find((round) => round.sessionId === sessionId)) {
        txRoundList.value.push({ sessionId })
      }
      if (type === 'bp' && isWitness && !bpRoundList.value.find((round) => round.sessionId === sessionId)) {
        currentStep.value = 1
        bpRoundList.value.push({
          witnessName: nodes.find((node) => node.id === toNodeId).name,
          sessionId,
          type
        })
        currentStage.value = `bp${bpRoundList.value.length}`
      }
      if (type === 'block' && !bpRoundList.value.find((round) => round.sessionId === sessionId)) {
        bpRoundList.value.push({ sessionId, type: 'block' })
        currentStage.value = `block`
      }
    }

    const simulate = () => {
      clearSwarm()
      currentStep.value = 0
      collectorName.value = 'No.4'
      txRoundList.value = []
      bpRoundList.value = []
      currentStage.value = ''
      ControlSimulatorComp.value.playPresent()
    }

    const stopSimulate = () => {
      ControlSimulatorComp.value.stopPresent()
    }

    const highlightBlockOrBp = (data) => {
      messageHandler.value.clearRoles(nodes.map((node) => node.id))
      swarmPainter.value.clearAll()
      chainBlockList.value[chainBlockList.value.length - 1].highlight = false
      if (data.roundId !== selectedRound.value) {
        const roundId = data.roundId
        const bpRound = bpList.value.findLast((bp) => bp.roundId === roundId)
        selectedRound.value = data.roundId
        const collectorId = bpRound.data.nodes[0].id
        const witnesses = bpRound.data.nodes.slice(1)
        const witnessIds = witnesses.map((node) => node.id)
        messageHandler.value.setRoles([collectorId], 'Collector')
        witnessIds.map((id, index) => {
          messageHandler.value.setRoles([id], `R${index + 1} Witness`)
        })
        setTimeout(() => {
          Array.from((document.getElementsByClassName('selected'))).map((dom) => {
            console.log(dom)
            dom.scrollIntoViewIfNeeded()
          })
        }, 0)
        currentStep.value = 3
        collectorName.value = bpRound.data.nodes[0].name
        txRoundList.value = [1, 2, 3]
        bpRoundList.value = witnesses.map((node) => ({ witnessName: node.name, type: 'bp' }))
        bpRoundList.value.push({ type: 'block '})
        currentStage.value = 'block'
      } else {
        selectedRound.value = ''
      }
    }

    const clearSwarm = () => {
      messageHandler.value.clearRoles(nodes.map((node) => node.id))
      selectedRound.value = ''
      swarmPainter.value.clearAll()
    }

    return {
      chainBlockList,
      blockList,
      bpList,
      bpRoundList,
      currentPrecent,
      currentStep,
      currentStage,
      txRoundList,
      currentBlockHeight,
      bpContainer,
      blockContainer,
      chainContainer,
      route,
      ControlSimulatorComp,
      presenting,
      selectedRound,
      collectorName,
      handleMsg,
      startPresent,
      endPresent,
      simulate,
      stopSimulate,
      highlightBlockOrBp,
      clearSwarm
    }
  }
})
</script>
  
<style lang="scss">
@import './swarm/basic.scss';
@import './swarm/swarm.scss';
.swarm {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  &-title {
    display: flex;
    flex-direction: column;
    align-items: center;
    .ant-steps {
      padding: 0 30vw;
      height: 145px;
      .ant-steps-item-description {
        max-width: 360px;
        font-size: 24px;
      }
      .swarm-step-description {
        white-space: nowrap;
        span {
          margin-left: 4px;
        }
        &.highlight.highlight-green .highlight-point {
          font-weight: bolder;
          color: #52c41a;
        }
        &.highlight.highlight-orange .highlight-point {
          font-weight: bolder;
          color: #fa8c16;
        }
      }
    }
  }
  &-main {
    flex-grow: 1;
    display: flex;
  }
  .node-info__link {
    color: #1890ff;
    border-bottom: solid 1px #1890ff;
    margin-right: 8px;
    &:hover {
      border-color: $primary-hover-color;
      color: $primary-hover-color;
    }
    &:active {
      border-color: $primary-active-color;
      color: $primary-active-color;
    }
  }
}
</style>