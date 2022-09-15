<template lang="pug">
.control-simulator(:style="simulatorStyle" ref="simulator" v-show="!isPresent")
  .control-simulator__dragging-bar(@mousedown="startDrag") Drag to move
  .form-container
    div(v-if="!isPresent")
      h3 Network
      AForm(:labelCol="{ span: 3 }")
        AFormItem(label="Type")
          ARadioGroup(v-model:value="networkType")
            ARadioButton(v-for="networkType in networkTypes", :value="networkType", :key="networkType") {{ networkType }}

        AFormItem(label="From")
          ARadioGroup(v-model:value="fromNodeId")
            ARadioButton(v-for="node in nodeList", :value="node.id", :key="node.id") {{ node.name }}

        AFormItem(label="To")
          ACheckbox(v-model:checked="checkAllTo", :indeterminate="checkAllIndeterminate", @change="onCheckAllChange") Check all
          div(style="width: 100%; border-bottom: solid 1px #dcdcdc; padding-bottom: 8px; margin-bottom: 8px")
          .to-node-checkbox-group(v-for="(node, index) in nodeList", :key="node.id", v-show="node.id !== fromNodeId")
            ACheckboxGroup(
              v-model:value="toNodeList[node.id]" @change="(checkedVal) => onCheckGroup(checkedVal, node.id)"
              :options="[{ label: node.name, value: node.id }, { label: 'valid', value: 'valid', disabled: !toNodeList[node.id].find(i => i === node.id) }, { label: 'overtime', value: 'overtime', disabled: !toNodeList[node.id].find(i => i === node.id) }]"
            )
        AFormItem(:wrapperCol="{offset: 3}")
          AButton(type="primary", @click="sendMsg('network')") Send

    div(v-if="!isPresent")
      h3 Chain
      AForm(:labelCol="{ span: 3 }")
        AFormItem(label="Event")
          ARadioGroup(v-model:value="chainType")
            ARadioButton(v-for="chainType in chainTypes", :value="chainType", :key="chainType") {{ chainType }}
        AFormItem(:wrapperCol="{offset: 3}")
          AButton(type="primary", @click="sendMsg('chain')") Send
    div(v-if="!isPresent")
      h3 Simulate
        AButton(v-if="presentStatus !== 'playing'" type="link" size="large" @click="playPresent")
          template(#icon)
            PlayCircleOutlined
        AButton(v-if="presentStatus === 'playing'" type="link" size="large" @click="pausePresent" disabled)
          template(#icon)
            PauseCircleOutlined
        AButton.ant-btn-icon-only.stop-btn(v-if="presentStatus !== 'stopped'" type="link" size="large" @click="stopPresent")
          .stop-btn__icon
            .stop-btn__icon-inner

</template>

<script>
import { defineComponent, onBeforeMount, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import nodes from './assets/nodes.json'
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons-vue'
import { getRandomIp, getRandomHash, sleep } from '../util.js'
import { message } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'

const networkTypes = ['tx', 'bp', 'block', 'fork']
const chainTypes = ['block on chain', 'chain fork']

let COMMUNICATE_COST = 2500
let COMMUNICATE_COST_THRESHOLD = 500 // 通信在2000~2500ms波动

const CALCULATE_COST = 1000
const CALCULATE_COST_THRESHOLD = 500 // 验证用时在500~1000ms波动

export default defineComponent({
  name: 'ControlSimulator',
  components: { PlayCircleOutlined, PauseCircleOutlined },
  props: {
    currentBlockH: {
      type: Number
    }
  },
  setup: (props, { emit }) => {
    const networkType = ref(networkTypes[0])
    const chainType = ref(chainTypes[0])
    const fromNodeId = ref(nodes[0].id)
    const nodeList = ref(nodes)
    const toNodeList = ref({})
    const checkAllIndeterminate = ref(false)
    const checkAllTo = ref(false)
    const currentBlockHeight = ref(props.currentBlockH || Math.ceil(Math.random() * 100))
    const presentStatus = ref('stopped') // stopped, playing, pausing
    const bpround = ref(0)
    const simulatorStyle = ref({})
    const simulatorDragging = ref(false)
    const simulator = ref(null)
    const mousePos = ref({ x: 0, y: 0 })
    const initSimulatorPos = ref({})
    const route = useRoute()
    const isPresent = ref(!route.query.manual)

    const initCheckAllTo = (checkAll = true) => {
      for (const node of nodes) {
        toNodeList.value[node.id] = checkAll ? [node.id, 'valid'] : []
      }

    }
    onBeforeMount(() => {
      initCheckAllTo()
    })

    const onCheckAllChange = () => {
      initCheckAllTo(checkAllTo.value)
    }

    const onCheckGroup = (checkedVal, nodeId) => {
      if (checkedVal.findIndex(toNodeChecked => toNodeChecked === nodeId) === -1) {
        toNodeList.value[nodeId] = []
      }
    }

    watch(
      () => toNodeList.value,
      () => {
        let selectCount = 0
        for (const node of nodes) {
          if (node.id === fromNodeId.value) continue
          if (toNodeList.value[node.id].findIndex(toNodeChecked => toNodeChecked === node.id) > -1) selectCount++
        }
        checkAllTo.value = selectCount >= nodes.length - 1
        checkAllIndeterminate.value = checkAllTo.value ? false : selectCount > 0
      },
      { deep: true }
    )

    const sendMsg = (type) => {
      if (type === 'network') sendNetworkSeriesMsg()
      else sendChainMessage()
    }

    const sendNetworkSeriesMsg = () => {
      const toList = parseToList()
      let block
      if (networkType.value === 'block') block = mockBlockInfo()
      const sessionId = getRandomHash()
      const randomWitness = toList[Math.floor(Math.random() * toList.length)]
      const verifyList = networkType.value === 'bp' ? [randomWitness] : toList
      sendDepartureMsg({ sessionId, toList, block, witnessId: randomWitness.node.id })
      sendArriveMsg({ sessionId, toList, block, witnessId: randomWitness.node.id })
      sendVerifyMsg(sessionId, verifyList)
    }

    const mockBlockInfo = () => {
      const address = getRandomIp()
      return {
        node: { address, i: Math.floor(Math.random() * 1000) },
        block: { height: currentBlockHeight.value++, hash: getRandomHash(), i: Math.floor(Math.random() * 1000) }
      }
    }

    const parseToList = () => {
      const list = []
      for (const node of nodes) {
        if (node.id === fromNodeId.value) continue
        if (toNodeList.value[node.id].length) {
          list.push({
            node,
            valid: !!toNodeList.value[node.id].find(item => item === 'valid'),
            overtime: !!toNodeList.value[node.id].find(item => item === 'overtime')
          })
        }
      }
      return list
    }

    const sendDepartureMsg = ({ sessionId, toList, count, block, witnessId, historyNodes, txCount, participantsCount, roundId }) => {
      for (const to of toList) {
        const msg = createNetworkMsg({ sessionId, to: to.node.name, witnessId, count, block, historyNodes, txCount, participantsCount, roundId });
        console.log(msg)
        emit('sendMsg', 'handleNetworkMessage', msg, 'departure')
        // this.messageHandler.handleNetworkMessage(msg, 'departure');
      }
    }

    const sendArriveMsg = ({ sessionId, toList, count, block, witnessId, historyNodes, txCount, participantsCount, autoDownplay, roundId }) => {
      let max = 0;
      for (const to of toList) {
        if (to.overtime) continue
        to.arriveTime = Math.random() * COMMUNICATE_COST_THRESHOLD + COMMUNICATE_COST
        max = Math.max(max, to.arriveTime);
        setTimeout(() => {
          const msg = createNetworkMsg({ sessionId, to: to.node.name, count, block, witnessId, isDeparture: false, historyNodes, txCount, participantsCount, roundId });
          emit('sendMsg', 'handleNetworkMessage', msg, 'arrive', autoDownplay)
          // this.messageHandler.handleNetworkMessage(msg, 'arrive');
        }, to.arriveTime)
      }
      return max
    }

    const sendVerifyMsg = (sessionId, nodeList, count, autoDownplay) => {
      const res = { cost: 0, nodeVerifyDownplayFn: null };
      for (const node of nodeList) {
        if (node.overtime) continue
        node.arriveAndCalcTime = node.arriveTime + Math.random() * CALCULATE_COST_THRESHOLD + CALCULATE_COST
        res.cost = Math.max(res.cost, node.arriveAndCalcTime);
        setTimeout(() => {
          const msg = createNodeVerifyMsg(sessionId, node.node.name, node.valid, count)
          emit('sendMsg', 'handleNodeVerify', msg, autoDownplay)
          // res.nodeVerifyDownplayFn = this.messageHandler.handleNodeVerify(msg, autoDownplay);
        }, node.arriveAndCalcTime);
      }
      return res;
    }

    const getShortFor = (str) => {
      if (str === 'block') return 'Bk'
      if (str === 'fork') return 'Fk'
      return str.toLocaleUpperCase()
    }

    const createNetworkMsg = ({ sessionId, to, count, block, witnessId, isDeparture, historyNodes, txCount, participantsCount, roundId }) => {
      if (isDeparture === undefined) isDeparture = true
      const msg = {
        roundId,
        sessionId,
        type: networkType.value,
        data: { content: getShortFor(networkType.value) + (count || 1) },
        from: { address: fromNodeId.value, i: Math.floor(Math.random() * 1000) },
        to: { address: nodes.find((node) => node.name === to).id, i: Math.floor(Math.random() * 1000) }
      }
      if (networkType.value === 'tx' && isDeparture) {
        msg.data.info = {
          from: getRandomHash(),
          to: getRandomHash()
        }
      }
      if (networkType.value === 'bp') {
        msg.data.isWitness = msg.to.address === witnessId
        msg.data.round = bpround.value || 1
        msg.data.nodes = historyNodes
        msg.data.bpTime = dayjs().subtract(msg.data.round * (Math.random() * 0.5 + 2), 'second').format('YYYY/MM/DD HH:mm:ss:SSS')
        msg.data.witnessTime = dayjs().format('YYYY/MM/DD HH:mm:ss:SSS')
      }
      if (networkType.value === 'block') {
        Object.assign(msg.data, block, { txCount, participantsCount });
      }
      if (isDeparture) msg.departureTime = new Date()
      else msg.arrivalTime = new Date()
      return msg
    }

    const createNodeVerifyMsg = (sessionId, to, valid, count) => {
      return {
        sessionId,
        type: networkType.value,
        data: { content: getShortFor(networkType.value) + (count || 1) },
        valid,
        node: { address: nodes.find((node) => node.name === to).id, i: Math.floor(Math.random() * 1000) }
      }
    }

    const sendChainMessage = (block, txCount, participantsCount, roundId) => {
      if (chainType.value === 'block on chain') {
        block = block || mockBlockInfo()
        txCount = txCount || Math.floor(Math.random() * 20) + 10
        participantsCount = participantsCount || Math.floor(Math.random() * 10) + 10
        emit('sendMsg', 'handleBlockOnChain', { data: { block, txCount, participantsCount }, roundId })
      } else {
        // TODO fork
        emit('sendMsg', 'handleChainForked', { data: {} })
        message.warning('TODO: fork on chain is not ready!')
      }
    }

    const playPresent = async () => {
      emit('startPresent')
      if (presentStatus.value === 'pausing') {
        presentStatus.value = 'playing'
        return
      }
      presentStatus.value = 'playing'
      const type = networkType.value;
      const from = fromNodeId.value;
      networkType.value = 'tx';
      // COMMUNICATE_COST = 200;
      // COMMUNICATE_COST_THRESHOLD = 50;
      const roundId = getRandomHash()
      emit('sendMsg', 'setRoles', [nodes[3].id], 'Collector')
      for (let i = 0; i < 3; i++) {
        if (presentStatus.value === 'stopped') break;
        // while(presentStatus.value === 'pausing') {}
        const sessionId = getRandomHash();
        const index = Math.random() < 0.5 ? 1 : 4; // 只有1或5来发
        fromNodeId.value = nodes[index].id;
        emit('sendMsg', 'setRoles', [nodes[index].id], 'highlightNode')
        const toList = nodes.filter((node) => (node.id !== fromNodeId.value)).map((node) => ({ node, valid: true, overtime: false }));
        sendDepartureMsg({ sessionId, toList, count: i + 1, roundId });
        sendArriveMsg({ sessionId, toList, count: i + 1, roundId });
        const collectorNode = toList.filter((to) => to.node.id === '444')
        // const res = sendVerifyMsg(sessionId, toList, i + 1);
        const res = sendVerifyMsg(sessionId, collectorNode, i + 1);
        await sleep(res.cost + 2500);
        emit('sendMsg', 'clearRoles', [nodes[index].id])
      }
      emit('sendMsg', 'clearRoles', [nodes[3].id])

      networkType.value = 'bp';
      const historyNodes = [];
      for (let i = 0; i < 2; i++) {
        emit('sendMsg', 'setRoles', [nodes[i === 0 ? 2 : 0].id], `R${i + 1} Witness`)
        if (presentStatus.value === 'stopped') break;
        // while(presentStatus.value === 'pausing') {}
        bpround.value = i + 1;
        const sessionId = getRandomHash();
        const index = i === 0 ? 3 : 2;
        emit('sendMsg', 'setRoles', [nodes[index].id], 'highlightNode')
        fromNodeId.value = nodes[index].id;
        if (i === 0) historyNodes.push(nodes[index])
        const toList = nodes.filter((node) => (node.id !== fromNodeId.value && node.id !== '444')).map((node) => ({ node, valid: true, overtime: false }));
        const witnessNode = toList.filter((to) => i === 0 ? to.node.id === '333' : to.node.id === '111')
        historyNodes.push(witnessNode[0].node)
        sendDepartureMsg({ sessionId, toList, count: i + 1, witnessId: witnessNode[0].node.id, historyNodes: JSON.parse(JSON.stringify(historyNodes)), roundId });
        sendArriveMsg({ sessionId, toList, count: i + 1, witnessId: witnessNode[0].node.id, historyNodes: JSON.parse(JSON.stringify(historyNodes)), roundId });
        const res = sendVerifyMsg(sessionId, witnessNode, i + 1);
        await sleep(res.cost + 2500);
        if (i === 0) {
          emit('sendMsg', 'clearRoles', [nodes[2].id, nodes[index].id])
        } else {
          emit('sendMsg', 'clearRoles', [nodes[2].id])
        }
      }

      let block;
      networkType.value = 'block';
      const txCount = 3
      const participantsCount = 3
      // while(presentStatus.value === 'pausing') {}
      if (presentStatus.value !== 'stopped') {
        const sessionId = getRandomHash();
        fromNodeId.value = nodes[0].id;
        const toList = nodes.filter((node) => (node.id !== fromNodeId.value)).map((node) => ({ node, valid: true, overtime: false }));
        block = mockBlockInfo();
        sendDepartureMsg({ sessionId, toList, block, txCount, participantsCount, roundId });
        sendArriveMsg({ sessionId, toList, block, txCount, participantsCount, autoDownplay: false, roundId });
        const res = sendVerifyMsg(sessionId, toList, null, false);
        await sleep(res.cost + 2500);
      }

      // while(presentStatus.value === 'pausing') {}
      if (presentStatus.value !== 'stopped') {
        const type = chainType.value
        chainType.value = 'block on chain'
        sendChainMessage(block, txCount, participantsCount, roundId)
        chainType.value = type
      }

      // COMMUNICATE_COST = 2000;
      // COMMUNICATE_COST_THRESHOLD = 500;
      presentStatus.value = 'stopped';
      networkType.value = type;
      fromNodeId.value = from;
      emit('endPresent')
    }

    const pausePresent = () => {
      presentStatus.value = 'pausing'
    }

    const stopPresent = () => {
      presentStatus.value = 'stopped'
      emit('clearSwarm')
    }

    onMounted(() => {
      initSimulatorPos.value.x = simulator.value.offsetLeft;
      initSimulatorPos.value.y = simulator.value.offsetTop;
      
      document.body.addEventListener("mousemove", onDragging);
      document.body.addEventListener("mouseup", onDragend);
    })

    onBeforeUnmount(() => {
      document.body.removeEventListener("mousemove", onDragging);
      document.body.removeEventListener("mouseup", onDragend);
    })

    const startDrag = (event) => {
      simulatorDragging.value = true;
      mousePos.value = {
        x: event.clientX,
        y: event.clientY
      }
    }

    const onDragging = (event) => {
      if (simulatorDragging.value) {
        simulatorStyle.value = {
          left: `${(parseInt(simulatorStyle.value.left) || initSimulatorPos.value.x) + event.clientX - mousePos.value.x}px`,
          top: `${(parseInt(simulatorStyle.value.top) || initSimulatorPos.value.y) + event.clientY - mousePos.value.y}px`,
          bottom: 'unset'
        }
        mousePos.value = {
          x: event.clientX,
          y: event.clientY
        }
      }
    }

    const onDragend = () => {
      simulatorDragging.value = false;
    }

    return {
      networkTypes,
      networkType,
      fromNodeId,
      nodeList,
      toNodeList,
      chainTypes,
      chainType,
      checkAllIndeterminate,
      checkAllTo,
      presentStatus,
      simulator,
      simulatorStyle,
      isPresent,
      onCheckAllChange,
      onCheckGroup,
      sendMsg,
      playPresent,
      pausePresent,
      stopPresent,
      startDrag
    }
  }
})
</script>

<style lang="scss" scoped>
.control-simulator {
  position: absolute;
  bottom: 5vh;
  left: 100px;
  border: solid 1px #dcdcdc;
  box-shadow: 0 0 4px 0 #000;
  // padding: 8px 16px;
  border-radius: 4px;
  background: #fff;
  user-select: none;
  
  .control-simulator__dragging-bar {
    height: 24px;
    width: 100%;
    cursor: move;
    color: #dcdcdc;
    text-align: center;
    &:hover {
      background: #dcdcdc;
      color: #fff;
    }
  }
  .form-container {
    margin: 8px 16px;
    .ant-checkbox-group {
      display: block;
    }
  }
  h3:not(:first-child) {
    border-top: solid 1px #dcdcdc;
  }
}

.stop-btn {
  display: inline-flex;
  justify-content: center;
  &__icon {
    border: solid 1px #1890ff;
    width: 18px;
    height: 18px;
    border-radius: 9px;
    &-inner {
      background: #1890ff;
      width: 8px;
      height: 8px;
      margin: 4px;
    }
  }
  &:hover .stop-btn__icon {
    border-color: #40a9ff;
    &-inner {
      background-color: #40a9ff;
    }
  }
  &:active .stop-btn__icon {
    border-color: #096dd9;
    &-inner {
      background-color: #096dd9;
    }
  }
}
</style>
