import { createLibp2p } from 'libp2p'
import { WebRTCDirect } from '@libp2p/webrtc-direct'
import { Mplex } from '@libp2p/mplex'
import { Noise } from '@chainsafe/libp2p-noise'
import { Bootstrap } from '@libp2p/bootstrap'

export class CrossBrowser {
  constructor(peerAddressList = []) {
    this.peerAddressList = peerAddressList
  }

  async init() {
    const libp2p = await createLibp2p({
      transports: [new WebRTCDirect()],
      streamMuxers: [new Mplex()],
      connectionEncryption: [new Noise()],
      peerDiscovery: [
        new Bootstrap({
          list: this.peerAddressList
        })
      ]
    })

    libp2p.addEventListener('peer:discovery', (e) => {
      console.info(`Found peer ${e.detail.id.toString()}`)
    })

    libp2p.connectionManager.addEventListener('peer:connect', (e) => {
      console.info(`Connected to ${e.detail.remotePeer.toString()}`)
    })

    libp2p.connectionManager.addEventListener('peer:disconnect', (e) => {
      console.info(`Disconnected from ${e.detail.remotePeer.toString()}`)
    })

    this.libp2p = libp2p
  }

  async start() {
    if (!this.libp2p) {
      await this.init()
    }
    await this.libp2p.start()
    console.info(`libp2p id is ${this.libp2p.peerId.toString()}`)
  }

  async stop() {
    if (!this.libp2p) {
      return
    }
    await this.libp2p.stop()
    this.libp2p = null
  }
}
