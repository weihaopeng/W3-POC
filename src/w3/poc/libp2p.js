import { WebRTCStar } from '@libp2p/webrtc-star'
import { createLibp2p } from 'libp2p'
import { WebSockets } from '@libp2p/websockets'
import { Noise } from '@chainsafe/libp2p-noise'
import { Mplex } from '@libp2p/mplex'
import { Bootstrap } from '@libp2p/bootstrap'

import { Multiaddr } from '@multiformats/multiaddr'

import { createFromJSON } from '@libp2p/peer-id-factory'
import peerIdJsons from '../../../test/fixtures/peer.ids.json'

const SIGNALING_SERVER_ADDRESS = [
  '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
  '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
]

const getPeerAddress = (peerId) => {
  return SIGNALING_SERVER_ADDRESS.map(adrrs =>  adrrs + '/p2p/' + peerId.toString())
}

const libp2p = {
  node: null,

  async init (libp2pBeforeStart) {
    const webRtcStar = new WebRTCStar()

    // Create our libp2p node
    const peerId = await libp2p.selectPeerId()
    const peersIds = this.getLocalPeersFromLocalStorage()
    const localPeersAddresses = peersIds.map(peerId => getPeerAddress(peerId)).flat()
    const localPeers = await Promise.all(peersIds.filter(p => p !== peerId.toString()).map(async peerId => {
      const multiaddrs = getPeerAddress(peerId).map(addr => {
        return new Multiaddr(addr)
      })
      return { peerId: await createFromJSON(peerIdJsons.find(json => json.id === peerId)), multiaddrs }
    }))
    this.node = await createLibp2p({
      peerId,
      addresses: {
        // Add the signaling server address, along with our PeerId to our multiaddrs list
        // libp2p will automatically attempt to dial to the signaling server so that it can
        // receive inbound connections from other peers
        listen: SIGNALING_SERVER_ADDRESS ,
        announce: getPeerAddress(peerId)
      },
      transports: [
        new WebSockets(),
        webRtcStar
      ],
      connectionEncryption: [new Noise()],
      streamMuxers: [new Mplex()],
      peerDiscovery: [
        webRtcStar.discovery,
        new Bootstrap({
          list: [
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
            ...localPeersAddresses
          ]
        })
      ]
    })

    // setTimeout( () => this.tryDialLocalPeers(localPeers), 10000)
    return this.node
  },

  async tryDialLocalPeers (localPeers) {
    await Promise.all(localPeers.map(({ peerId, multiaddrs }) => {
      // this.node.peerStore.addressBook.add(peerId, multiaddrs)
      return this.node.dial(peerId).catch(e => {
        debugger
        console.log(e)
      })
    }))
  },


  destroy () {
    this.node.stop()
    this.node = null
  },

  async selectPeerId () {
    const usedPeerIds = this.getLocalPeersFromLocalStorage()
    const availablePeerId = peerIdJsons.find(peerIdJson => !usedPeerIds.includes(peerIdJson.id))
    if (!availablePeerId) {throw new Error(`can't find available peer id`)}
    this.savePeerIdsInLocalStorage([...usedPeerIds, availablePeerId.id])
    console.log('--- select peer id:', availablePeerId.id)
    return createFromJSON(availablePeerId)
  },

  savePeerIdsInLocalStorage (peerIds) { // 当前节点的peerId保存在localStorage中，方便其他本地节点连接，远程节点连接比较慢
    window.localStorage.setItem('w3:node:peerId', peerIds.join('|'))
  },

  removePeerIdFromLocalStorage () { // 当前节点的peerId保存在localStorage中，方便其他本地节点连接，远程节点连接比较慢
    const peerId = this.libp2p.peerId.toString()
    console.log('---- peerId: ', peerId)
    const peers = this.getLocalPeersFromLocalStorage()
    peers.filter(p => p !== peerId)
    window.localStorage.setItem('w3:node:peerId', peers.join('|'))
    return peers
  },

  getLocalPeersFromLocalStorage () {
    return (window.localStorage.getItem('w3:node:peerId') || '').split('|').filter(p => p)
  },

}

window?.addEventListener('beforeunload', () => {
  libp2p.removePeerIdFromLocalStorage()
})


export { libp2p, SIGNALING_SERVER_ADDRESS }
