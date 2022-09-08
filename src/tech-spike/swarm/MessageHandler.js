const DELAY_FOR_VIEW = 1500 // 到达节点的延时隐藏
const TIMEOUT_THRESHOLD = 5000 // 超时判定机制

class MessageHandler {
  constructor({ chainPainter, blockPainter, swarmPainter, bpPainter, nodes }) {
    this.chainPainter = chainPainter
    this.blockPainter = blockPainter
    this.swarmPainter = swarmPainter
    this.bpPainter = bpPainter
    this.nodes = nodes
  }

  handleNetworkMessage(msg, action) {
    if (action) msg.action = action
    switch (msg.type) {
      case 'tx':
        this.handleTxOnNetwork(msg)
        break
      case 'bp':
        this.handleBpOnNetwork(msg)
        break
      case 'block':
        this.handleBlockOnNetwork(msg)
        break
      case 'fork':
        this.handleForkOnNetwork(msg)
        break
      default:
        break
    }
  }

  handleBlockOnChain(msg) {
    this.chainPainter.append(msg.data)
  }

  handleChainForked(msg) {
    // TODO
  }

  handleNodeVerify(msg) {
    // TODO
    console.log(msg)
    const node = this.nodes.find((node) => node.id === msg.node.address)
    this.swarmPainter.highlightNodes([node], msg)
    setTimeout(() => {
      this.swarmPainter.downplayNodes([node], msg)
    }, DELAY_FOR_VIEW)
  }

  handleTxOnNetwork(msg) {
    console.log('get tx msg on network', msg)
    msg.action === 'arrive' ? this.arriveOnSwarm(msg) : this.departureOnSwarm(msg)
    // this.txPainter.append(data)
  }

  handleBpOnNetwork(msg) {
    console.log('get bp msg on network', msg)
    if (msg.action === 'arrive') {
      this.arriveOnSwarm(msg)
      msg.from = this.nodes.find((node) => node.id === msg.from.address)
      msg.to = this.nodes.find((node) => node.id === msg.to.address)
      this.bpPainter.append(msg)
    } else if (msg.action === 'eliminate') {
      this.arriveOnSwarm(msg)
    } else {
      this.departureOnSwarm(msg)
    }
  }

  handleBlockOnNetwork(msg) {
    console.log('get block msg on network', msg)
    if (msg.action === 'arrive') {
      this.arriveOnSwarm(msg)
    } else {
      this.departureOnSwarm(msg)
      this.blockPainter.append(msg.data)
    }
  }

  handleForkOnNetwork(msg) {
    console.log('get fork msg on network', msg)
    // TODO modify myself's chain?
    if (msg.action === 'arrive') {
      this.arriveOnSwarm(msg)
    } else {
      this.departureOnSwarm(msg)
    }
  }

  departureOnSwarm(msg) {
    const from = this.nodes.find((node) => node.id === msg.from.address)
    const to = this.nodes.find((node) => node.id === msg.to.address)
    this.swarmPainter.highlightNodes([from], msg)
    this.swarmPainter.highlightLines([{ from, to }])
    setTimeout(() => {
      this.swarmPainter.downplayNodes([from], msg)
      this.swarmPainter.downplayLines([{ from, to }], msg)
    }, TIMEOUT_THRESHOLD)
  }

  arriveOnSwarm(msg) {
    const from = this.nodes.find((node) => node.id === msg.from.address)
    const to = this.nodes.find((node) => node.id === msg.to.address)
    this.swarmPainter.highlightNodes([to], msg)
    setTimeout(() => {
      this.swarmPainter.downplayLines([{ from, to }], msg)
      this.swarmPainter.downplayNodes([to], msg)
    }, DELAY_FOR_VIEW)
  }
}

export default MessageHandler
