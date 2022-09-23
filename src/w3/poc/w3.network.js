/**
 * remote swarms, node outside the webpage
 */
import { libp2p } from './libp2p.js'
import { toString, fromString } from 'uint8arrays'


class W3Network {
  static HEARTBEAT_INTERVAL = 1000 * 3 // 3 seconds
  constructor (localSwarm, reactState) {
    this.localSwarm = localSwarm
    this.reactState = reactState
    this.remoteSwarms = this.reactState.remoteSwarms
    this.topics = ['tx', 'bp', 'block', 'fork', 'swarm:init', 'libp2p:online', 'libp2p:heartbeat',]
    this.inboundListener = this.dispatchPubsub.bind(this)
  }

  get swarmTopics () {
    return this.topics.filter(t => !t.startsWith('libp2p:')) // libp2p.online is used by libp2p
  }

  get peerId() {
    return this.libp2p.peerId.toString()
  }

  async init () {
    this.libp2p = await libp2p.init()
    await this.libp2p.start()
    this.pubsub = this.libp2p.pubsub
    await this.startListenPubsub()
    this.listenLibp2p() // for debug libp2p connection and state
    // this.localSwarm?.init(this) // TODO: currently the epoch without tx should be fixed
    this.reactState.status = 'libp2p started as: ' + this.peerId
    await this.startListenLocalSwarm()
    this.startHeartbeat()
  }

  async destroy () {
    this.stopHeartbeat()
    this.stopListenLocalSwarm()
    this.localSwarm?.destroy()
    this.reactState.status = 'libp2p stopped'
    this.libp2p.removeAllListeners()
    this.stopListenPubsub()
    this.libp2p.destroy()
  }

  startListenLocalSwarm() {
    this.outboundListeners = this.swarmTopics.map(topic => {
      const listener = ({origin, data, network }) => {
        if (this.isOutboundMsg(origin)) this.broadcast(topic, {origin, data}) // 要避免echo回发来自network的消息
      }
      this.localSwarm?.on(topic, listener)
      return { topic, listener }
    })
  }

  isOutboundMsg (origin) {
    return typeof origin !== 'string' || !origin.startsWith('network') // 本地消息的origin，通常是Node对象。
  }

  stopListenLocalSwarm() {
    this.outboundListeners.forEach(({topic, listener}) => {
      this.localSwarm?.off(topic, listener)
    })
  }

  async startListenPubsub () {
    this.pubsub.addEventListener('message', this.inboundListener)
    return Promise.all(this.topics.map(topic => this.pubsub.subscribe(topic)))
  }

  async stopListenPubsub () {
    this.pubsub.removeEventListener('message', this.inboundListener)
    return Promise.all(this.topics.map(topic => this.pubsub.unsubscribe(topic)))
  }


  async dispatchPubsub(evt) {
    let { data, topic } = evt.detail
    data = JSON.parse(toString(evt.detail.data))
    console.log(`--- on topic '${topic} %o'`, data)
    this.swarmTopics.includes(topic) ? this.localSwarm?.broadcast(topic, data.data, `network:${data.origin}`)
      : this.handleLibp2pTopics(topic, data)
  }

  broadcast (topic, data) {
    data = fromString(JSON.stringify(data))
    this.pubsub.publish(topic, data)
  }

  listenLibp2p () {
    this.libp2p.addEventListener('peer:discovery', (evt) => {
      const peer = evt.detail
      // console.info(`Found peer ${peer.id.toString()}`)
      this.reactState.foundPeers++
    })

    // Listen for new connections to peers
    this.libp2p.connectionManager.addEventListener('peer:connect', async (evt) => {
      const connection = evt.detail
      console.info(`Connected to ${connection.remotePeer.toString()}`)
      this.reactState.connectedPeers++
    })

    // Listen for peers disconnecting
    this.libp2p.connectionManager.addEventListener('peer:disconnect', (evt) => {
      const connection = evt.detail
      const peerId = connection.remotePeer.toString()
      console.info(`Disconnected from ${peerId}`)
      this.reactState.connectedPeers--
      this.remoteSwarms.splice(this.remoteSwarms.indexOf(peerId), 1)
    })
  }

  // 注意：节点非正常离开未做处理，因为这样的代价比较大，现在还没有必要。
  // 正常离开后，会自动断开连接，从而触发peer:disconnect事件，在上面处理了。
  startHeartbeat () {
    this.heartBeatTimer = setInterval(() => {
      const data = { origin:  this.peerId, event: 'libp2p:heartbeat'}
      this.broadcast('libp2p:heartbeat', data)
    }, this.constructor.HEARTBEAT_INTERVAL)
  }

  stopHeartbeat () {
    clearInterval(this.heartBeatTimer)
  }

  handleLibp2pTopics(topic, data) {
    switch (topic) {
      case 'libp2p:online':
      case 'libp2p:heartbeat':
        this.remoteSwarms.includes(data.origin) || this.remoteSwarms.push(data.origin)
        break
      default:
        console.error('unknown topic', topic, data)
    }
  }
}

export { W3Network }
