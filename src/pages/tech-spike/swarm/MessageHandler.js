const DELAY_FOR_VIEW = 1500 // 到达节点的延时隐藏
const TIMEOUT_THRESHOLD = 5000 // 超时判定机制
const COLLECTOR_SYMBOL_SVG = "path://M1003.237316 290.095135a36.952838 36.952838 0 0 0-2.50788-10.594512 36.543389 36.543389 0 0 0-1.893705-5.015759 38.027644 38.027644 0 0 0-9.314981-11.106324c-0.40945-0.358269-0.614175-0.921262-1.023624-1.27953l-0.204725-0.051182a38.130006 38.130006 0 0 0-13.972472-6.500014l-236.508402-55.787526a38.385912 38.385912 0 0 0-17.606338 74.622214l96.937224 22.878003L512 388.721339 206.704044 297.209324l96.681318-22.878004A38.385912 38.385912 0 1 0 285.676661 199.709107L49.62889 255.547814a37.8741 37.8741 0 0 0-13.972472 6.500014L35.502874 262.150191c-0.255906 0.204725-0.307087 0.511812-0.511812 0.665356a37.976463 37.976463 0 0 0-9.877975 11.771679 36.492207 36.492207 0 0 0-1.893705 4.913397 37.106382 37.106382 0 0 0-2.55906 10.748056c0 0.921262-0.614175 1.740161-0.614175 2.712604V849.710556a38.437094 38.437094 0 0 0 27.381951 36.748114l453.465578 135.937311a38.897725 38.897725 0 0 0 22.110286 0l261.228929-78.460805a38.385912 38.385912 0 1 0-22.110286-73.547408l-211.787874 63.618252V457.406532l376.744935-112.956945v378.024465a38.385912 38.385912 0 1 0 76.771825 0V292.910102c0-1.023624-0.562993-1.842524-0.665356-2.814967zM96.817972 344.551949L473.614088 457.406532v476.650669l-376.744935-112.905764zM965.516759 802.367931a38.385912 38.385912 0 0 0-38.385912 38.385912v3.992135a36.748113 36.748113 0 0 0 38.385912 36.338664 40.177255 40.177255 0 0 0 38.385913-40.330799 38.385912 38.385912 0 0 0-38.385913-38.385912z M486.76766 299.921929a38.385912 38.385912 0 0 0 9.417344 6.090564c0.40945 0.153544 0.870081 0.102362 1.279531 0.255906a38.078825 38.078825 0 0 0 14.484284 3.070873 30.196918 30.196918 0 0 0 18.783506-5.629933 37.259926 37.259926 0 0 0 6.653558-3.940954l99.649829-87.724605a38.385912 38.385912 0 1 0-50.720586-57.578869l-35.929214 31.629992V38.181188a38.385912 38.385912 0 0 0-76.771824 0v149.142064l-38.590638-33.165428a38.385912 38.385912 0 1 0-50.055229 58.141862z"
const WITNESS_SYMBOL_SVG = "path://M887.893547 870.208l67.413333 67.413333c16.64 16.64 16.746667 43.52-0.042667 60.309334a42.666667 42.666667 0 0 1-60.288 0.042666l-67.413333-67.413333a192 192 0 1 1 60.330667-60.330667zM592.960213 2.24c6.677333 2.133333 12.970667 5.909333 18.24 11.306667l250.389334 255.786666c3.904 3.989333 6.954667 8.533333 9.109333 13.397334 2.496 3.456 3.968 7.68 3.968 12.245333v237.802667h-85.333333v-173.653334h-141.781334a128 128 0 0 1-128.106666-128.128V85.333333H128.000213v853.333334h432.426667v85.333333H106.60288A63.850667 63.850667 0 0 1 42.66688 959.936V64.064A64 64 0 0 1 106.60288 0h476.757333c3.477333 0 6.72 0.810667 9.6 2.24z m11.818667 127.018667v101.738666a42.666667 42.666667 0 0 0 42.773333 42.773334h98.218667l-141.013333-144.512zM725.333547 874.666667a106.666667 106.666667 0 1 0 0-213.333334 106.666667 106.666667 0 0 0 0 213.333334zM170.66688 469.333333a42.666667 42.666667 0 0 1 42.602667-42.666666h469.461333c23.530667 0 42.602667 18.944 42.602667 42.666666a42.666667 42.666667 0 0 1-42.602667 42.666667H213.269547A42.538667 42.538667 0 0 1 170.66688 469.333333z m0 170.666667c0-23.573333 19.136-42.666667 42.794667-42.666667h213.077333c23.637333 0 42.794667 18.944 42.794667 42.666667 0 23.573333-19.136 42.666667-42.794667 42.666667H213.461547A42.624 42.624 0 0 1 170.66688 640z m0 170.666667c0-23.573333 19.136-42.666667 42.794667-42.666667h213.077333c23.637333 0 42.794667 18.944 42.794667 42.666667 0 23.573333-19.136 42.666667-42.794667 42.666666H213.461547A42.624 42.624 0 0 1 170.66688 810.666667z"

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
      this.swarmPainter.setNodeName(id, `${role}: ${node.name}`)
      if (role === 'Collector') this.swarmPainter.setNodeSymbol(id, COLLECTOR_SYMBOL_SVG, 42, '#52c41a')
      else this.swarmPainter.setNodeSymbol(id, WITNESS_SYMBOL_SVG, 42, '#fa8c16')
    }
  }

  clearRoles(ids) {
    for (const id of ids) {
      const node = this.nodes.find((node) => node.id === id)
      this.swarmPainter.setNodeName(id, node.name.substring(node.name.indexOf('No')))
      this.swarmPainter.setNodeSymbol(id, undefined, undefined, undefined)
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
