/**
 * remote swarms, node outside the webpage
 */
import { libp2p } from './libp2p.js'
import { toString, fromString } from 'uint8arrays'

class W3Network {
  constructor (localSwarm, reactState) {
    this.localSwarm = localSwarm
    this.reactState = reactState
    this.remoteSwarms = []
    this.topics = ['tx', 'bp', 'block', 'fork', 'node:online']
    this.inboundListener = this.dispatchPubsub.bind(this)
  }

  get localTopics () {
    return this.topics.filter(t => !t.startsWith('node:'))
  }


  async init () {
    this.libp2p = await libp2p.init()
    await this.libp2p.start()
    this.pubsub = this.libp2p.pubsub
    await this.startListenPubsub()
    this.listenLibp2p() // for debug libp2p connection and state
    // this.localSwarm?.init(this) // TODO: currently the epoch without tx should be fixed
    this.reactState.status = 'libp2p started as: ' + this.libp2p.peerId.toString()
    await this.startListenLocalSwarm()
  }

  async destroy () {
    this.stopListenLocalSwarm()
    this.localSwarm?.destroy()
    this.reactState.status = 'libp2p stopped'
    this.libp2p.removeAllListeners()
    this.stopListenPubsub()
    this.libp2p.destroy()
  }

  startListenLocalSwarm() {
    this.outboundListeners = this.localTopics.map(topic => {
      const listener = ({origin, data, network }) => {
        if (origin !== 'network') this.broadcast(topic, {origin, data}) // 来自network的消息，要避免echo回发
      }
      this.localSwarm?.on(topic, listener)
      return { topic, listener }
    })
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
    this.localSwarm?.broadcast(topic, data, 'network')
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
      console.info(`Disconnected from ${connection.remotePeer.toString()}`)
      this.reactState.connectedPeers--
    })
  }
}

export { W3Network }
