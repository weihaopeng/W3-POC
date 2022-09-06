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
    msg.action === 'arrive' ? this.arriveOnSwarm(msg.data) : this.departureOnSwarm(msg.data)
    // this.txPainter.append(data)
  }

  handleBpOnNetwork(msg) {
    console.log('get bp msg on network', msg)
    if (msg.action === 'arrive') {
      this.arriveOnSwarm(msg.data)
      this.bpPainter.append(msg.data)
    } else if (msg.action === 'eliminate') {
      this.arriveOnSwarm(msg.data)
    } else {
      this.departureOnSwarm(msg.data)
    }
  }

  handleBlockOnNetwork(msg) {
    console.log('get block msg on network', msg)
    if (msg.action === 'arrive') {
      this.arriveOnSwarm(msg.data)
      this.blockPainter.append(msg.data)
    } else {
      this.departureOnSwarm(msg.data)
    }
  }

  handleForkOnNetwork(data) {
    // TODO
  }

  departureOnSwarm(data) {
    this.swarmPainter.highlightNodes([data.from])
    this.swarmPainter.highlightLines([data])
  }

  arriveOnSwarm(data) {
    this.swarmPainter.highlightNodes([data.to])
    setTimeout(() => {
      this.swarmPainter.downplayLines([data])
    }, DELAY_FOR_VIEW / 2)
  }
}

export default MessageHandler
