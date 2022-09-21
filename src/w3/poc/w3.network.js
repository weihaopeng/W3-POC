/**
 * remote swarms, node outside the webpage
 */
import { libp2p } from './libp2p.js'
import { peerIdFromString } from '@libp2p/peer-id'
import { GossipSub } from '@chainsafe/libp2p-gossipsub'

// const GossipSub = require('@chainsafe/libp2p-gossipsub')
//
// const gsub = new GossipSub(libp2p, options)

class W3Network {
  constructor () {
    this.remoteSwarms = []
    this.topics = ['tx', 'bp', 'block', 'fork', 'w3:node:online']
    this.encoder = new TextEncoder()
  }

  async init (localSwarm, state) {
    // TODO: @Jian-ru 完成
    this.localSwarm = localSwarm
    this.libp2p = await libp2p.init()
    await this.libp2p.start()
    state.status = 'libp2p started as: ' + this.libp2p.peerId.toString()
    await this.initPubsub()

    this.listenLibp2p(state)
  }

  async initPubsub () {
    this.pubsub = new GossipSub()
    // this.pubsub = new GossipSub({allowPublishToZeroPeers: true}) // 这里设置为true，为了压制 `InsufficientPeers` 错误
    // 按照 https://github.com/ChainSafe/js-libp2p-gossipsub/issues/309 说法，js-libp2p@0.38 应该没有这个问题了，可实际上我们还是会遇到
    await this.pubsub.init(this.libp2p.components)
    await this.pubsub.start()
  }

  async startListen () {
    this.listeners = await Promise.all(this.topics.map(async topic => {
      const listener = await this.listen(topic)
      this.localSwarm?.listen(topic, (msg) => {
        this.broadcast(topic, msg)
      })
      return { topic, listener }
    }))
  }

  async destroy () {
    this.unListenAllTopics()
    this.libp2p && this.libp2p.stop()
    this.libp2p = null
  }

  async listen (topic) {
    // listen to remoteSwarms(libp2p)'s pub/sub topic
    const listener = (data) => {
      debugger
      console.log('--- on topic', topic, data)
      this.localSwarm?.broadcast(topic, data)
    }
    this.pubsub.addEventListener(topic, listener)
    await this.pubsub.subscribe(topic)
    return listener
  }

  unListenAllTopics () {
    this.listeners.map(({ topic, listener }) => {
      this.pubsub.removeEventListener(topic, listener)
      this.pubsub.unsubscribe(topic)
    })
  }

  broadcast (topic, msg) {
    this.pubsub.publish(topic, this.encoder.encode(msg))
      // .catch(e => {
      //   console.log('--- broadcast error', e)
      // })
  }

  listenLibp2p (state) {
    this.libp2p.addEventListener('peer:discovery', (evt) => {
      const peer = evt.detail
      // console.info(`Found peer ${peer.id.toString()}`)
      state.foundPeers++
    })

    // Listen for new connections to peers
    this.libp2p.connectionManager.addEventListener('peer:connect', async (evt) => {
      const connection = evt.detail
      console.info(`Connected to ${connection.remotePeer.toString()}`)
      state.connectedPeers++
    })

    // Listen for peers disconnecting
    this.libp2p.connectionManager.addEventListener('peer:disconnect', (evt) => {
      const connection = evt.detail
      console.info(`Disconnected from ${connection.remotePeer.toString()}`)
      state.connectedPeers--
    })

  }
}

export { W3Network }
