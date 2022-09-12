<template lang="pug">
.swarm
  .swarm-title
    h1 Two-stages Mint Simulation
    ASteps(:precent="currentPrecent", :current="currentStep")
      AStep(title="Collecting Stage")
        template(#description)
          .swarm-step-description(v-if="currentStage" :class="{ highlight: currentStage === 'tx' }")
            span random collector: No.4
            span.highlight-point {{ txRoundList.length }}/3
            span Txs
      AStep(title="Witness(BP) & Mint(Block)")
        template(#description)
          .swarm-step-description(v-for="(bpRound, index) in bpRoundList", :class="{ highlight: currentStage === `bp${index + 1}` || bpRound.type === 'block' }")
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
        .chain-container(v-for="block in chainBlockList" :class="{ highlight: block.highlight }")
          .block-info
            div(style="max-width: 210px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;") {{ block.data.block.block.hash }}
            div Height: {{ block.data.block.block.height }}
            div Tx Count: {{ block.data.txCount }}
          .node-info
            div Participants Count: {{ block.data.participantsCount }}
            div Addr {{ block.data.block.node.address }}

    .block-column
      h1 block
      #block-container(ref="blockContainer")
        .block-container(v-for="block in blockList" :class="{ highlight: block.highlight }")
          .block-info
            div(style="max-width: 210px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;") {{ block.data.block.hash }}
            div Height: {{ block.data.block.height }}
            div Tx Count: {{ block.data.txCount }}
          .node-info
            div Participants Count: {{ block.data.participantsCount }}
            div Addr {{ block.data.node.address }}

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
        .bp-container(v-for="(bp, bpIndex) in bpList" :class="{ highlight: bp.highlight }")
          span Witness Round{{ bp.data.round }}
          div Bp At: {{ bp.data.bpTime }}
          div Witness At: {{ bp.data.witnessTime }}
          .bp-node(
            v-for="(node, index) in bp.data.nodes",
            :style="{ color: bpIndex === bpList.length - 1 && bpRoundList.length === bpList.length && index === bp.data.nodes.length - 1 ? '#1890ff' : '#000' }"
          )
            span {{ index === 0 ? 'Collector' : `Witness${index}` }}: 
            span(style="margin-left: 4px;") {{ node.name }}

    ControlSimulator(:currentBlockH="currentBlockHeight" @sendMsg="handleMsg" @startPresent="startPresent" @endPresent="endPresent")
</template>

<script>
import { defineComponent, onBeforeMount, onMounted, ref } from 'vue'
import ControlSimulator from './swarm/control-simulator.vue'
import { useRoute } from 'vue-router'
import { getRandomIp, getRandomHash } from './util.js'
import dayjs from 'dayjs'

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
        const ifAddToChain = i === mockRound - 1 || Math.random() < 0.6
        const obj = { data: mockBlockInfo(ifAddToChain) }
        obj.data.txCount = Math.floor(Math.random() * 20) + 10,
        obj.data.participantsCount = Math.floor(Math.random() * 10) + 10
        blockList.value.push(obj)
        if(ifAddToChain) {
          chainBlockList.value.push({
            data: {
              block: obj.data,
              txCount: obj.data.txCount,
              participantsCount: obj.data.participantsCount
            }
          })
        }
        for (let j = 0; j < Math.random() * 3 + 3; j++) {
          const minuteAgo = Math.floor(Math.random() * 20)
          const randomMs = Math.floor(Math.random() * 10000)
          const baseTime = dayjs().subtract(minuteAgo * 60000 + randomMs, 'millisecond')
          const noIndex = Math.floor(Math.random() * 5);
          const participantsNodes = nodes.filter((node, index) => index !== noIndex)
          participantsNodes.sort(() => (Math.random() - 0.5))
          for (let round = 0; round < Math.random() * 3; round++) {
            bpList.value.push({
              data: {
                nodes: participantsNodes.filter((node, index) => index <= round + 1),
                bpTime: baseTime.add(round * 3000 + Math.floor(Math.random() * 1000), 'millisecond').format('YYYY/MM/DD HH:mm:ss:SSS'),
                witnessTime: baseTime.add((round + 1) * 3000 + Math.floor(Math.random() * 1000), 'millisecond').format('YYYY/MM/DD HH:mm:ss:SSS'),
                round: round + 1
              }
            })
          }
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
      handleMsg,
      startPresent,
      endPresent
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
      padding: 0 20vw;
      height: 100px;
      .ant-steps-item-description {
        max-width: 210px;
      }
      .swarm-step-description {
        white-space: nowrap;
        span {
          margin-left: 4px;
        }
        &.highlight .highlight-point {
          font-weight: bolder;
          color: #1890ff;
        }
      }
    }
  }
  &-main {
    flex-grow: 1;
    display: flex;
  }
}
</style>