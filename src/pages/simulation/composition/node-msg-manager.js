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
    presentMode: false,
    msgList: []
  }
})

const updateConfig = (NODES_AMOUNT, LATENCY_UPPER_BOUND, LOCAL_COMPUTATION_LATENCY, WITNESSES_AMOUNT, COLLECTORS_AMOUNT, presentMode) => {
  store.state.nodesAmount = NODES_AMOUNT
  store.state.latencyUpperBound = LATENCY_UPPER_BOUND
  store.state.localComputationLatency = LOCAL_COMPUTATION_LATENCY
  store.state.witnessesAmount = WITNESSES_AMOUNT
  store.state.collectorsAmount = COLLECTORS_AMOUNT
  store.state.presentMode = presentMode
}

const addMsg = (msg, event) => {
  msg.event = event
  msg.remove = false
  msg.toRemove = false
  msg.timeout = false
  store.state.msgList.push(msg)
  updateHistoryMsg(msg)
}

const updateHistoryMsg = (msg) => {
  if (msg.event === 'network.msg.arrival') {
    msg.timeoutTimer = setTimeout(() => timeoutMsg(msg), store.state.localComputationLatency + store.state.latencyUpperBound) // remove if not valid before latency.
  }
  if (msg.event === 'node.verify') {
    const networkMsgs = filterMsgAboutData(msg.data, msg.type)
    // 1 departure, other all arrival. Then mark departure as remove. It should be call when arrival, but for view well, remove after verify animation.
    // present mode, the block is the last round. keep it.
    if (networkMsgs.length === store.state.nodesAmount && !(store.state.presentMode && msg.type === 'block'))
      clearMsgTimeoutAndRemove(networkMsgs.find((msg) => msg.event === 'network.msg.departure'))

    const msgs = filterMsgAboutData(msg.data, msg.type, false)
    const verifyCount = msgs.filter((msgItem) => msgItem.event === 'node.verify').length
    const arrivalMsgs = msgs.filter((msgItem) => msgItem.event === 'network.msg.arrival')
    if (store.state.presentMode && msg.type === 'block') return
    if ((msg.type === 'tx' && verifyCount === store.state.collectorsAmount) || (msg.type === 'bp' && verifyCount >= store.state.witnessesAmount)) {
      // remove all msg when the verify count equals with collector count or witness count.
      for (const arrivalMsg of arrivalMsgs) {
        clearMsgTimeoutAndRemove(arrivalMsg)
      }
    } else {
      // remove this node's arrival msg related to the verify msg.
      const arrivalMsg = arrivalMsgs.find((msgItem) => msgItem.to && msgItem.to.address === getNodeAddress(msg.node))
      clearMsgTimeoutAndRemove(arrivalMsg)
    }
  }
  if (msg.event === 'network.msg.departure' && !(store.state.presentMode && msg.type === 'block')) {
    msg.timeoutTimer = setTimeout(() => timeoutMsg(msg), store.state.latencyUpperBound + store.state.localComputationLatency)
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

const ifMsgAboutNode = (msg, nodeKey, ignoreRemove = true, onlyNetworkMsg = true) => {
  if (ignoreRemove && msg.remove) return false
  if (onlyNetworkMsg && msg.event.indexOf('network') === -1) return false // or chain event msg
  if (!msg.to && !msg.from && msg.node && getNodeAddress(msg.node) === nodeKey) return true
  if (!msg.to && msg.from && msg.from.address === nodeKey) return true
  if (msg.to && msg.to.address === nodeKey) return true
}

const filterMsgAboutNode = (nodeKey, ignoreRemove = true, onlyNetworkMsg = true) => {
  return store.state.msgList.filter((msg) => ifMsgAboutNode(msg, nodeKey, ignoreRemove, onlyNetworkMsg))
}

const ifMsgAboutData = (msg, data, type, onlyNetworkMsg = true) => {
  if (msg.remove) return false
  if (onlyNetworkMsg && msg.event.indexOf('network') === -1) return false
  if (msg.data.i === data.i && msg.type === type) return true
}

const filterMsgAboutData = (data, type, onlyNetworkMsg) => {
  return store.state.msgList.filter((msg) => ifMsgAboutData(msg, data, type, onlyNetworkMsg))
}

const getNodeAddress = (node) => {
  if (node.address) return node.address
  if (node.account.addressString) return node.account.addressString
  return ''
}

const ifValid = (msg) => {
  const verifiedMsg = store.state.msgList.find((msgItem) => {
    return msgItem.event === 'node.verify' && msgItem.type === msg.type && msgItem.data.i === msg.data.i && getNodeAddress(msgItem.node) === (msg.to && msg.to.address)
  })
  if (!verifiedMsg) return null
  return verifiedMsg.valid
}

const calcNodeRoleInfo = (nodeAddr, nodePubKey) => {
  const msgs = filterMsgAboutNode(nodeAddr)
  // TODO: remove old role when a new role is seted related to the old role's data.
  // e.g., tx1 -> node1 collector, set node1 collector; bp1 -> tx1 -> node3 witness, set node3 witness and remove node1's role.
  let collectorMsgCount
  if (store.state.presentMode) {
    const msgs = filterMsgAboutNode(nodeAddr, false)
    collectorMsgCount = (msgs.find((msg) => msg.role === 'collector') && !msgs.find((msg) => msg.type === 'bp')) ? 1 : 0
  } else collectorMsgCount = msgs.filter((msg) => msg.event === 'network.msg.arrival' && msg.role === 'collector').length
  // const collectorMsgCount = msgs.filter((msg) => msg.event === 'network.msg.arrival' && msg.role === 'collector').length
  const witnessMsgs = msgs.filter((msg) => msg.event === 'network.msg.arrival' && msg.role === 'witness')
  const departureMsgCount = msgs.filter((msg) => msg.event === 'network.msg.departure').length
  if (collectorMsgCount) return { role: 'Collector' }
  if (witnessMsgs.length) return { role: 'Witness', round: (witnessMsgs[witnessMsgs.length - 1].data.witnessRecords?.findIndex((record) => record.witness && record.witness.publicKeyString === nodePubKey) || 0) + 1 }
  if (departureMsgCount) return { role: 'sender' }
  return { role: 'default' }
}

const clearAll = () => {
  store.state.msgList = []
}

export const nodeMsgManager = () => ({
  store,
  addMsg,
  updateConfig,
  filterMsgAboutNode,
  calcNodeRoleInfo,
  ifValid,
  clearAll
})
