const DELAY_FOR_VIEW = 2500 // 到达节点的延时隐藏
const TIMEOUT_THRESHOLD = 5000 // 超时判定机制

class MessageHandler {
  constructor({ chainPainter, blockPainter, swarmPainter, bpPainter, nodes }) {
    // this.chainPainter = chainPainter
    // this.blockPainter = blockPainter
    this.swarmPainter = swarmPainter
    // this.bpPainter = bpPainter
    this.nodes = nodes
    this.departureMap = {}
  }

  handleNetworkMessage(msg, action, autoDownplay) {
    if (action) msg.action = action
    switch (msg.type) {
      case 'tx':
        this.handleTxOnNetwork(msg)
        break
      case 'bp':
        this.handleBpOnNetwork(msg)
        break
      case 'block':
        this.handleBlockOnNetwork(msg, autoDownplay)
        break
      case 'fork':
        this.handleForkOnNetwork(msg)
        break
      default:
        break
    }
  }

  handleBlockOnChain(msg) {
    // this.chainPainter.append(msg.data)
  }

  handleChainForked(msg) {
    // TODO
  }

  handleNodeVerify(msg, autoDownplay = true) {
    // TODO
    console.log(msg)
    const node = this.nodes.find((node) => node.id === msg.node.address)
    this.swarmPainter.highlightNodes([node], msg)
    if (autoDownplay) {
      setTimeout(() => {
        this.swarmPainter.downplayNodes([node], msg)
      }, DELAY_FOR_VIEW)
    } else {
      return () => {
        this.swarmPainter.downplayNodes([node], msg)
      };
    }
  }

  handleTxOnNetwork(msg) {
    console.log('get tx msg on network', msg)
    msg.action === 'arrive' ? this.arriveOnSwarm(msg) : this.departureOnSwarm(msg)
    // this.txPainter.append(data)
  }

  setRoles(ids, role) {
    for (const id of ids) {
      const node = this.nodes.find((node) => node.id === id)
      this.swarmPainter.setNodeRoleName(id, role)
      if (role === 'highlightNode') this.swarmPainter.setNodeSymbol(id, 'highlight-node')
      else if (role === 'Collector') this.swarmPainter.setNodeSymbol(id, 'collector')
      else this.swarmPainter.setNodeSymbol(id, 'witness')
    }
  }

  clearRoles(ids) {
    for (const id of ids) {
      const node = this.nodes.find((node) => node.id === id)
      this.swarmPainter.setNodeRoleName(id, '')
      this.swarmPainter.setNodeSymbol(id, 'default-node')
    }
  }

  handleBpOnNetwork(msg) {
    console.log('get bp msg on network', msg)
    if (msg.action === 'arrive') {
      this.arriveOnSwarm(msg)
      msg.from = this.nodes.find((node) => node.id === msg.from.address)
      msg.to = this.nodes.find((node) => node.id === msg.to.address)
      // if (msg.data.isWitness) {
      //   this.bpPainter.append(msg)
      // }
    } else if (msg.action === 'eliminate') {
      this.arriveOnSwarm(msg)
    } else {
      this.departureOnSwarm(msg)
    }
  }

  handleBlockOnNetwork(msg, autoDownplay) {
    console.log('get block msg on network', msg)
    if (msg.action === 'arrive') {
      this.arriveOnSwarm(msg, autoDownplay)
    } else {
      this.departureOnSwarm(msg)
      // this.blockPainter.append(msg.data)
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
    const sessionId = msg.sessionId;
    if (!this.departureMap[sessionId]) this.departureMap[sessionId] = { from: msg.from, to: [] }
    this.departureMap[sessionId].to.push(JSON.parse(JSON.stringify(msg.to)));
    setTimeout(() => {
      if (this.departureMap[sessionId].to.length === 0) return
      this.swarmPainter.setSelectedLineColor('#f5222d')
      setTimeout(() => {
        this.swarmPainter.downplayNodes([from], msg)
        this.swarmPainter.downplayLines([{ from, to }], msg)
        this.swarmPainter.setSelectedLineColor('#1890ff')
      }, DELAY_FOR_VIEW)
    }, TIMEOUT_THRESHOLD)
  }

  arriveOnSwarm(msg, autoDownplay) {
    const from = this.nodes.find((node) => node.id === msg.from.address)
    const to = this.nodes.find((node) => node.id === msg.to.address)
    this.swarmPainter.highlightNodes([to], msg);
    const sessionId = msg.sessionId;
    const index = this.departureMap[sessionId].to.findIndex((node) => node.address === to.id);
    if (index > -1) this.departureMap[sessionId].to.splice(index, 1);
    if (autoDownplay !== false) {
      setTimeout(() => {
        this.swarmPainter.downplayLines([{ from, to }], msg)
        this.swarmPainter.downplayNodes([to], msg)
        if (this.departureMap[sessionId].to.length === 0) {
          this.swarmPainter.downplayNodes([from], msg)
        }
      }, DELAY_FOR_VIEW)
    }
  }
}

export default MessageHandler
