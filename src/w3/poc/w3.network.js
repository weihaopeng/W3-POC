/**
 * remote swarms, network outside the webpage
 */
import { libp2p } from './libp2p.js'

class W3Network {
  constructor () {
    this.remoteSwarms = []
    this.topics = ['tx', 'bp', 'block', 'fork']
  }

  async init(localSwarm, libp2pBeforeStart) {
    // TODO: @Jian-ru 完成
    this.localSwarm = localSwarm
    debugger
    this.libp2p = await libp2p.init(libp2pBeforeStart)
    // this.topics.map(topic => {
    //   this.listen(topic)
    //   this.localSwarm.listen(topic, (msg) => {
    //     this.broadcast(topic, msg)
    //   })
    // })
    // this.localSwarm.listen()
  }

  async destroy() {
    this.topics.map(topic => {
      this.unListen(topic)
      // this.localSwarm.unListen(topic) // 不用unListen， this.broadcast中做了预防
    })
    this.libp2p && this.libp2p.stop()
    this.libp2p = null
  }

  listen(topic) {
    // listen to remoteSwarms(libp2p)'s pub/sub topic
    this.libp2p.subscribe('topic', (data) => this.localSwarm.broadcast(topic, data))
  }

  broadcast(topic, msg) {
    this.libp2p?.publish(topic, msg)
  }
}

export { W3Network }
