class Network {
  constructor (config) {
    this.config = config
  }

  async init () {
    // TODO: connect to the p2p network
  }

  async queryPeers (query, depth = 1) { // 默认只在peers中间查询
  }
}

export { Network }
