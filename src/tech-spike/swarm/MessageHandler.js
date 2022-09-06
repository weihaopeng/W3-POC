const DELAY_FOR_VIEW = 2000

class MessageHandler {
  constructor({ chainPainter, blockPainter, swarmPainter, bpPainter }) {
    this.chainPainter = chainPainter
    this.blockPainter = blockPainter
    this.swarmPainter = swarmPainter
    this.bpPainter = bpPainter
  }

  handleNetworkMessage(msg) {
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
      this.bpPainter.append(msg.data)
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
      this.blockPainter.append(msg.data)
    } else {
      this.departureOnSwarm(msg)
    }
  }

  handleForkOnNetwork(data) {
    // TODO
  }

  departureOnSwarm(msg) {
    const data = msg.data
    this.swarmPainter.highlightNodes([data.from], msg)
    this.swarmPainter.highlightLines([data])
  }

  arriveOnSwarm(msg) {
    const data = msg.data
    this.swarmPainter.highlightNodes([data.to], msg)
    setTimeout(() => {
      this.swarmPainter.downplayLines([data], msg)
    }, DELAY_FOR_VIEW)
  }
}

export default MessageHandler
