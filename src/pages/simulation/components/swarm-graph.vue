<template lang="pug">
.swarm-graph
  .swarm-graph__cvs(ref="swarmCvs")
  .swarm-graph__node-circle(:style="swarmCircleStyle")
  .swarm-graph__node-container
    SwarmNode(v-for="node in swarmNodes" :node="node")
  .swarm-graph__legend
    div Legend
      div
        span TX 
        span.swarm-graph__legend-description → Transaction
      div
        span BP 
        span.swarm-graph__legend-description → Block Proposal
      div
        span Bk 
        span.swarm-graph__legend-description → Block
      div
        span Fk 
        span.swarm-graph__legend-description → Chain forked
</template>

<script>
import { computed, defineComponent, onBeforeMount, onMounted, ref, toRefs, watch } from 'vue'
import SwarmNode from './swarm-node.vue'
import * as echarts from 'echarts'
const SYMBOL_SIZE = 44

import { nodeMsgManager } from '../composition/node-msg-manager.js'

const { store: nodeMsgStore, filterMsgAboutNode, calcNodeRoleInfo, ifValid } = nodeMsgManager()

export default defineComponent({
  name: 'SwarmGraph',
  components: { SwarmNode },
  props: {
    nodes: {
      type: Array,
      default: () => []
    },
    playing: {
      type: Boolean,
      default: false
    }
  },
  setup: (props) => {
    const swarmCvs = ref(null)
    const chart = ref(null)
    const swarmNodes = ref([])
    const swarmCircleStyle = ref({})

    const calcSwarmNodes = () => {
      swarmNodes.value = props.nodes.map((node, index) => {
        const addrStr = node.address
        const pubKey = node.publicKey
        return {
          id: addrStr,
          pubKey,
          i: node.i,
          number: index + 1,
          name: `${addrStr.substring(0, 6)}`,
          tooltips: [], // tooltip: { id, content, data: { from, to, title }, valid }
          role: 'default', // type: default | sender | Collector | Witness
          // rolePrefix: '' // R1, R2...
        }
      })
    }

    const links = computed(() => {
      const links = []
      for (let index = 0; index < swarmNodes.value.length; index++) {
        const node = swarmNodes.value[index]
        swarmNodes.value.map((n, i) => {
          const curveness = index > i ? 0.1 : -0.1
          if (n.id !== node.id) links.push({ source: index, target: i, lineStyle: { curveness } })
        })
      }
      return links
    })

    onMounted(() => {
      chart.value = echarts.init(swarmCvs.value)
      if (props.nodes.length) {
        initChart()
        setNodesCoordinates()
      }
      window.addEventListener('resize', () => {
        chart.value.resize()
        setNodesCoordinates()
      })
    })

    watch(() => props.nodes, () => {
      if (props.nodes.length !== swarmNodes.value.length) {
        calcSwarmNodes()
        if (chart.value) {
          initChart()
          setNodesCoordinates()
        }
      }
    }, { deep: true })

    const type2Title = (type) => {
      if (type.length === 2) return type.toLocaleUpperCase()
      return type[0].toLocaleUpperCase() + type[type.length - 1].toLocaleLowerCase()
    }

    const reRender = () => {
      reDrawNode()
      highlightLine()
    }

    const reDrawNode = () => {
      if (!props.playing) return
      for (const node of swarmNodes.value) {
        const { role, round } = calcNodeRoleInfo(node.id, node.pubKey)
        node.role = role
        if (round) node.rolePrefix = `R${round}`
        const msgs = filterMsgAboutNode(node.id)
        node.tooltips = msgs.map((msg) => {
          return {
            id: msg.data.i,
            data: {
              title: type2Title(msg.type) + msg.data.i,
              from: msg.type === 'tx' && !msg.to ? msg.data.from.addressString : '',
              to: msg.type === 'tx' && !msg.to ? msg.data.to.addressString : ''
            },
            toRemove: msg.toRemove,
            valid: ifValid(msg),
            type: msg.type
          }
        }).reverse()
      }
    }

    watch(() => nodeMsgStore.state.msgList, (val) => {
      if (!val.length) resetSwarm()
      else reRender()
    }, { deep: true })

    const resetSwarm = () => {
      calcSwarmNodes()
      setNodesCoordinates()
      chart.value.dispatchAction({ type: 'unselect', dataIndex: links.value.map((link, index) => index), dataType: 'edge' })
    }

    const customRenderNode = (nodeI, role, round) => {
      const node = swarmNodes.value.find((node) => node.i === nodeI)
      node.role = role
      if (round) node.rolePrefix = `R${round}`
    }

    const initChart = () => {
      const option = {
        series: [
          {
            symbolSize: SYMBOL_SIZE,
            symbol: 'circle',
            name: 'W3 Swarm',
            type: 'graph',
            layout: 'circular',
            animation: false,
            edgeSymbol: ['circle', 'arrow'],
            edgeSymbolSize: [1, 10],
            circular: {
              rotateLabel: false
            },
            data: swarmNodes.value,
            links: links.value,
            itemStyle: {
              color: 'transparent'
            },
            lineStyle: {
              color: '#5b8ff9',
              width: 2,
              opacity: 0
            },
            selectedMode: 'multiple',
            select: {
              lineStyle: {
                opacity: 1
              }
            }
          }
        ]
      }
      chart.value.setOption(option)
    }

    const setNodesCoordinates = () => {
      const nodeLayouts = chart.value._chartsViews[0]._symbolDraw._data._itemLayouts
      nodeLayouts.map((coordinate) => {
        coordinate[0] = Math.floor(coordinate[0])
        coordinate[1] = Math.floor(coordinate[1])
      })
      const { offsetWidth, offsetHeight } = swarmCvs.value
      for(let i = 0; i < swarmNodes.value.length; i++) {
        const [x, y] = nodeLayouts[i]
        swarmNodes.value[i].x = x
        swarmNodes.value[i].y = y
        swarmNodes.value[i].tooltipPos = x < offsetWidth / 2 ? 'left' : 'right'
      }
      if (nodeLayouts.length) {
        const radius = Math.sqrt(Math.pow(offsetWidth / 2 - nodeLayouts[0][0], 2) + Math.pow(offsetHeight / 2 - nodeLayouts[0][1], 2))
        swarmCircleStyle.value = { height: `${2 * radius}px`, width: `${2 * radius}px` }
      }
    }

    const highlightLine = () => {
      const goingDepartureMsgs = nodeMsgStore.state.msgList.filter((msgItem) => {
        return msgItem.event === 'network.msg.departure' && !msgItem.remove
      })
      const dataIndex = []
      for (const departureMsg of goingDepartureMsgs) {
        const fromNodeAddr = departureMsg.from.address
        const fromIndex = swarmNodes.value.findIndex((node) => node.id === fromNodeAddr)
        const goingArrivalMsgs = nodeMsgStore.state.msgList.filter((msgItem) => {
          return msgItem.event === 'network.msg.arrival' && !msgItem.remove && msgItem.from.address === fromNodeAddr
        })
        // departure and no one arrival.
        if (goingArrivalMsgs.length === 0) {
          for (let i = 0; i < links.value.length; i++) {
            if (links.value[i].source === fromIndex) dataIndex.push(i)
          }
        }
        for (const arrivalMsg of goingArrivalMsgs) {
          const toNodeAddr = arrivalMsg.to.address
          const toIndex = swarmNodes.value.findIndex((node) => node.id === toNodeAddr)
          const lineIndex = links.value.findIndex((link) => link.source === fromIndex && link.target === toIndex)
          dataIndex.push(lineIndex)
        }
      }
      chart.value.dispatchAction({ type: 'unselect', dataIndex: links.value.map((link, index) => index), dataType: 'edge' })
      chart.value.dispatchAction({ type: 'select', dataIndex, dataType: 'edge' })
    }

    return {
      swarmCvs,
      swarmNodes,
      swarmCircleStyle,
      reRender,
      resetSwarm,
      customRenderNode
    }
  }
})
</script>

<style lang="scss" scoped>
.swarm-graph {
  width: 100%;
  height: 100%;
  position: relative;
  padding: 20px;
  box-sizing: border-box;
  &__cvs {
    width: 100%;
    height: 100%;
  }
  &__node-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  &__node-circle {
    position: absolute;
    top: 50%;
    left: 50%;
    border-radius: 50%;
    border: solid 1px rgba(255, 255, 255, 0.1);
    transform: translate(-50%, -50%);
  }

  &__legend {
    position: absolute;
    top: 0;
    left: 30px;
    color: #fff;
    font-weight: 900;
    &-description {
      font-weight: 500;
    }
  }

  .swarm-cvs-container {
    flex-grow: 1;
    // background: #dcdcdc;
    width: 100%;
    position: relative;
    padding: 20px;
    box-sizing: border-box;
    #swarm-node-cvs {
      width: 100%;
      height: 100%;
    }
    #swarm-tooltip-container, #swarm-node-container {
      position: absolute;
      top: 20px;
      left: 20px;
      width: calc(100% - 80px);
      height: calc(100% - 80px);
    }
  }
}
</style>