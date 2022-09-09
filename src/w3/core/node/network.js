/**
 * Abstract interface
 * Node use this interface to interact with the network (other nodes)
 */
class Network {

  async init () {
    // TODO: connect to the p2p network
  }

  async queryPeers (query, depth = 1) { // 默认只在peers中间查询
  }

  listen (event, cb) {

  }

  broadcast (event, data) {

  }
}

export { Network }
