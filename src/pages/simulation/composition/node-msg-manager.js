import { reactive } from 'vue';
const removeTimeout = 500
const validTimeout = 1000

const store = reactive({
  state: {
    nodesAmount: 5,
    latencyUpperBound: 100,
    localComputationLatency: 100,
    witnessesAmount: 2,
    collectorsAmount: 2,
    msgList: []
  }
})

const updateConfig = (NODES_AMOUNT, LATENCY_UPPER_BOUND, LOCAL_COMPUTATION_LATENCY, WITNESSES_AMOUNT, COLLECTORS_AMOUNT) => {
  store.state.nodesAmount = NODES_AMOUNT
  store.state.latencyUpperBound = LATENCY_UPPER_BOUND
  store.state.localComputationLatency = LOCAL_COMPUTATION_LATENCY
  store.state.witnessesAmount = WITNESSES_AMOUNT
  store.state.collectorsAmount = COLLECTORS_AMOUNT
}

const addMsg = (msg, event, autoRemove) => {
  msg.event = event
  msg.remove = false
  msg.toRemove = false
  msg.timeout = false
  store.state.msgList.push(msg)
  updateHistoryMsg(msg, autoRemove)
}

const updateHistoryMsg = (msg, autoRemove = true) => {
  if (msg.event === 'network.msg.arrival') {
    const msgs = filterMsgAboutData(msg, msg.type)
    // 1 departure, other all arrival. Then mark departure as remove.
    if (msgs.length === store.state.nodesAmount)
      removeMsg(msgs.find((msg) => msg.event === 'network.msg.departure'))
    if (autoRemove) msg.timeoutTimer = setTimeout(() => timeoutMsg(msg), store.state.localComputationLatency + store.state.latencyUpperBound) // remove if not valid before latency.
  }
  if (msg.event === 'node.verify') {
    const msgs = filterMsgAboutData(msg.data, msg.type, false)
    const verifyCount = msgs.filter((msgItem) => msgItem.event === 'node.verify').length
    const arrivalMsgs = msgs.filter((msgItem) => msgItem.event === 'network.msg.arrival')
    console.log(msg.type === 'tx', verifyCount, verifyCount === store.state.collectorsAmount)
    if ((msg.type === 'tx' && verifyCount === store.state.collectorsAmount) || (msg.type === 'bp' && verifyCount === store.state.witnessesAmount)) {
      // remove all msg when the verify count equals with collector count or witness count.
      for (const arrivalMsg of arrivalMsgs) {
        clearMsgTimeoutAndRemove(arrivalMsg)
      }
    } else {
      // remove this node's arrival msg related to the verify msg.
      const arrivalMsg = arrivalMsgs.find((msgItem) => msgItem.to && msgItem.to.address === msg.node.account.addressString)
      clearMsgTimeoutAndRemove(arrivalMsg)
    }
  }
  if (msg.event === 'network.msg.departure' && autoRemove) {
    setTimeout(() => timeoutMsg(msg), store.state.latencyUpperBound)
  }
}

const clearMsgTimeoutAndRemove = (msg) => {
  clearTimeout(msg.timeoutTimer)
  setTimeout(() => removeMsg(msg), validTimeout)
}

const timeoutMsg = (msg) => {
  removeMsg(msg, true)
}

const removeMsg = (msg, timeout) => {
  if (msg.remove) return
  msg.timeout = timeout
  msg.toRemove = true
  setTimeout(() => {
    msg.toRemove = false
    msg.remove = true
  }, removeTimeout)
}

const ifMsgAboutNode = (msg, nodeKey, onlyNetworkMsg = true) => {
  if (msg.remove) return false
  if (onlyNetworkMsg && msg.event.indexOf('network') === -1) return false // or chain event msg
  if (!msg.to && msg.from.address === nodeKey) return true
  if (msg.to && msg.to.address === nodeKey) return true
}

const filterMsgAboutNode = (nodeKey) => {
  return store.state.msgList.filter((msg) => ifMsgAboutNode(msg, nodeKey))
}

const ifMsgAboutData = (msg, data, type, onlyNetworkMsg = true) => {
  if (msg.remove) return false
  if (onlyNetworkMsg && msg.event.indexOf('network') === -1) return false
  if (msg.data.i === data.i && msg.type === type) return true
}

const filterMsgAboutData = (data, type, onlyNetworkMsg) => {
  return store.state.msgList.filter((msg) => ifMsgAboutData(msg, data, type, onlyNetworkMsg))
}

const ifValid = (msg) => {
  const verifiedMsg = store.state.msgList.find((msgItem) => {
    return msgItem.event === 'node.verify' && msgItem.type === msg.type && msgItem.data.i === msg.data.i && msgItem.node.account.addressString === (msg.to && msg.to.address)
  })
  // if (store.state.msgList.length > 10) debugger
  if (!verifiedMsg) return null
  return verifiedMsg.valid
}

const calcNodeRoleInfo = (nodeKey) => {
  const msgs = filterMsgAboutNode(nodeKey)
  const collectorMsgCount = msgs.filter((msg) => msg.event === 'node.chosenAs' && msg.role === 'collector').length // TODO, this msg hasn't implemented.
  const witnessMsgCount = msgs.filter((msg) => msg.event === 'node.chosenAs' && msg.role === 'witness').length
  const departureMsgCount = msgs.filter((msg) => msg.event === 'network.msg.departure').length
  if (collectorMsgCount) return { role: 'Collector' }
  if (witnessMsgCount) return { role: 'Witness', round: witnessMsgCount }
  if (departureMsgCount) return { role: 'sender' }
  return { role: 'default' }
}

export const nodeMsgManager = () => ({
  store,
  addMsg,
  updateConfig,
  filterMsgAboutNode,
  calcNodeRoleInfo,
  ifValid
})
