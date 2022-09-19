<template lang="pug">
.swarm
  .swarm-header
    .swarm-header__title Two-stages Mint Simulation
    .swarm-header__operation
      AButton.play-btn(v-if="!presenting"  shape="circle" @click="simulate")
        template(#icon)
          img(:src="PlayPng")
      AButton.ant-btn-icon-only.stop-btn(v-else @click="stopSimulate")
        template(#icon)
          img(:src="StopPng")
      AButton.clear-btn(shape="circle" @click="clearSwarmPainter")
        template(#icon)
          img(:src="ClearPng")

  .swarm-main
    .chain-column
      .chain-column__title chain
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
      .block-column__title block
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
      .swarm-steps
        .swarm-steps__config Config: { NODES_AMOUNT: 5, COLLECTORS_AMOUNT: 1, WITNESSES_AMOUNT: 1, WITNESS_ROUNDS_AMOUNT: 2, TX_COUNT: 3 }
        ASteps(:percent="currentPercent * 33", :current="currentStep")
          AStep(title="Collecting Stage" disabled)
            template(#description)
              .swarm-step-description.highlight-green(v-if="currentStage" :class="{ highlight: currentStage === 'tx' }")
                span random collector: {{ collectorName }}
                span.highlight-point {{ txRoundList.length }}/3
                span Txs
          AStep(title="Witness (BP) & Mint (Block)" disabled)
            template(#description)
              .swarm-step-description.highlight-orange(v-for="(bpRound, index) in bpRoundList", :class="{ highlight: currentStage === `bp${index + 1}` || bpRound.type === 'block' }")
                div(v-if="bpRound.type === 'bp'")
                  span Round
                  span.highlight-point {{ index + 1 }}
                  span random witness: 
                  span.highlight-point {{ bpRound.witnessName }}
                span.highlight-point(v-else) Mint

      .swarm-cvs-container
        #swarm-node-cvs
        #swarm-node-container
        #swarm-tooltip-container
        .swarm-tooltip-legend
          div Legend
          div
            span TX 
            span.swarm-tooltip-legend__description → Transaction
          div
            span BP 
            span.swarm-tooltip-legend__description → Block Proposal
          div
            span Bk 
            span.swarm-tooltip-legend__description → Block
          div
            span Fk 
            span.swarm-tooltip-legend__description → Chain forked
        AButton(@click="clearSwarmPainter" type="primary" style="position: absolute; top: 0; transform: translateY(-100%)" v-if="route.query.manual") Clear All
      
    .bp-column
      .bp-column__title bp
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
import PlayPng from '@/assets/play.png'
import StopPng from '@/assets/stop.png'
import ClearPng from '@/assets/clear.png'

import nodes from './swarm/assets/nodes.json'
import MessageHandler from './swarm/MessageHandler.js'
import SwarmPainter from './swarm/painter/SwarmPainter.js'

export default defineComponent({
  name: 'Swarm',
  components: { ControlSimulator },
  setup: () => {
    const chainBlockList = ref([])
    const blockList = ref([])
    const bpList = ref([])
    const bpRoundList = ref([])
    const collectorName = ref('No.4')
    const currentPercent = ref(0)
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

        const minuteAgo = Math.floor(Math.random() * 20) + (mockRound - i) * 20
        const randomMs = Math.floor(Math.random() * 10000)
        const baseTime = dayjs().subtract(minuteAgo * 60000 + randomMs, 'millisecond')
        const noIndex = Math.floor(Math.random() * 5);
        const participantsNodes = nodes.filter((node, index) => index !== noIndex)
        participantsNodes.sort(() => (Math.random() - 0.5))
        const round1BpTime = generateTime(baseTime, Math.floor(Math.random() * 1000))
        const round1WitnessTime = generateTime(baseTime, 3000 + Math.floor(Math.random() * 1000))
        const round2BpTime = generateTime(round1WitnessTime, Math.floor(Math.random() * 1000))
        const round2WitnessTime = generateTime(round2BpTime, 3000 + Math.floor(Math.random() * 1000))
        for (let round = 0; round < 2; round++) {
          bpList.value.push({
            data: {
              nodes: participantsNodes.filter((node, index) => index <= round + 1),
              bpTime: round === 0 ? round1BpTime.format('YYYY/MM/DD HH:mm:ss:SSS') : round2BpTime.format('YYYY/MM/DD HH:mm:ss:SSS'),
              witnessTime: round === 0 ? round1WitnessTime.format('YYYY/MM/DD HH:mm:ss:SSS') : round2WitnessTime.format('YYYY/MM/DD HH:mm:ss:SSS'),
              round: round + 1
            },
            roundId
          })
        }
      }
    }

    const generateTime = (baseTime, addTime) => {
      return baseTime.add(addTime, 'millisecond')
    }

    onBeforeMount(() => mockData())

    onMounted(() => {
      swarmPainter.value = new SwarmPainter(document.getElementById('swarm-node-cvs'), document.getElementById('swarm-tooltip-container'), document.getElementById('swarm-node-container'), nodes)
      swarmPainter.value.init()
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
      const type = args[0].type
      const sessionId = args[0].sessionId
      const isWitness = args[0].data.isWitness
      const toNodeId = args[0].to?.address
      const action = args[1]
      if (!currentStage.value) currentStage.value = 'tx'
      if (type === 'tx' && action === 'departure' && !txRoundList.value.find((round) => round.sessionId === sessionId)) {
        txRoundList.value.push({ sessionId })
        currentPercent.value++
      }
      if (type === 'bp' && isWitness && !bpRoundList.value.find((round) => round.sessionId === sessionId)) {
        if (bpRoundList.value.length === 0 ) currentPercent.value = 0
        currentStep.value = 1
        bpRoundList.value.push({
          witnessName: nodes.find((node) => node.id === toNodeId).name,
          sessionId,
          type
        })
        currentStage.value = `bp${bpRoundList.value.length}`
        currentPercent.value++
      }
      if (type === 'block' && !bpRoundList.value.find((round) => round.sessionId === sessionId)) {
        bpRoundList.value.push({ sessionId, type: 'block' })
        currentStage.value = `block`
        currentPercent.value++
      }
    }

    const simulate = () => {
      resetSwarm()
      ControlSimulatorComp.value.playPresent()
    }

    const resetSwarm = () => {
      clearSwarmCvs()
      currentStep.value = 0
      collectorName.value = 'No.4'
      txRoundList.value = []
      bpRoundList.value = []
      currentStage.value = ''
      currentPercent.value = 0
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
        resetSwarm()
      }
    }

    const clearSwarmCvs = () => {
      messageHandler.value.clearRoles(nodes.map((node) => node.id))
      selectedRound.value = ''
      swarmPainter.value.clearAll()
    }

    const clearSwarmPainter = () => {
      swarmPainter.value.clearAll()
    }

    return {
      chainBlockList,
      blockList,
      bpList,
      bpRoundList,
      currentPercent,
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
      PlayPng,
      StopPng,
      ClearPng,
      handleMsg,
      startPresent,
      endPresent,
      simulate,
      stopSimulate,
      highlightBlockOrBp,
      clearSwarmCvs,
      clearSwarmPainter
    }
  }
})
</script>
  
<style lang="scss">
@import './swarm/swarm.scss';
.swarm {
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
    font-weight: 700;
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
        &:hover::after {
          content: '';
          width: 100%;
          height: 100%;
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
          top: 0;
          left: 0;
          border-radius: 50%;
        }
        &:active::after {
          content: '';
          width: 100%;
          height: 100%;
          position: absolute;
          background: rgba(0, 0, 0, 0.1);
          top: 0;
          left: 0;
          border-radius: 50%;
        }
      }
    }
  }
  &-main {
    flex-grow: 1;
    display: flex;
    overflow: hidden;
  }
  .swarm-steps {
    height: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    &__config {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.5);
      margin: 15px 0 12px;
      text-align: center;
    }
    .ant-steps {
      // padding: 0 200px;
      // width: 700px;
      justify-content: center;
      .ant-steps-item {
        cursor: default;
        width: 350px;
        max-width: 350px;
        &:last-child {
          width: 400px;
          max-width: 400px;
        }
      }
      .ant-steps-item-title {
        color: #fff;
        font-weight: 900;
        font-size: 24px;
        &::after {
          height: 2px
        }
      }

      .ant-progress-circle-trail {
        display: none;
      }
      .ant-steps-item-icon {
        background: #5B8FF9;
        border-color: #5B8FF9;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
      }
      .ant-steps-item:not(.ant-steps-item-process) .ant-steps-item-icon {
        border-width: 2px;
      }
      .ant-steps-item-process > .ant-steps-item-container > .ant-steps-item-content > .ant-steps-item-title::after {
        background: rgba(#d9d9d9, 0.8);
      }
      .ant-steps-item-wait {
        .ant-steps-item-title {
          color: rgba(255, 255, 255, 0.8);
          font-weight: normal;
        }
        .ant-steps-item-icon {
          background-color: transparent;
          border-color: rgba(255, 255, 255, 0.8);
          .ant-steps-icon {
            color: rgba(255, 255, 255, 0.8);
          }
        }
      }
      .ant-progress-inner {
        max-width: 36px;
        max-height: 36px;
        svg path {
          stroke-width: 8;
          stroke: rgb(101, 144, 242) !important;
        }
      }
      .ant-steps-item-finish {
        .ant-steps-item-icon {
          background-color: transparent;
          border-color: #5B8FF9;
          .ant-steps-icon {
            color: #5B8FF9;
          }
        }
        .ant-steps-item-title::after {
          background: #5b8ff9;
        }
      }
      .ant-steps-item-description {
        max-width: 360px;
        font-size: 14px;
        color: #fff;
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
    }
  }
  .swarm-tooltip-legend {
    position: absolute;
    top: 0;
    left: 30px;
    color: #fff;
    .swarm-tooltip-legend__description {
      font-weight: 300;
    }
  }
  .node-info__link {
    color: #1890ff;
    border-bottom: solid 1px #1890ff;
    margin-right: 8px;
    &:hover {
      border-color: #40a9ff;
      color: #40a9ff;
    }
    &:active {
      border-color: #096dd9;
      color: #096dd9;
    }
  }
}
</style>