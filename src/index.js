import { createLibp2p } from 'libp2p'
import { WebSockets } from '@libp2p/websockets'
import { WebRTCStar } from '@libp2p/webrtc-star'
import { Noise } from '@chainsafe/libp2p-noise'
import { Mplex } from '@libp2p/mplex'
import { Bootstrap } from '@libp2p/bootstrap'

let foundPeers = 0, connectedPeers = 0
document.addEventListener('DOMContentLoaded', async () => {
  const webRtcStar = new WebRTCStar()

  // Create our libp2p node
  const libp2p = await createLibp2p({
    addresses: {
      // Add the signaling server address, along with our PeerId to our multiaddrs list
      // libp2p will automatically attempt to dial to the signaling server so that it can
      // receive inbound connections from other peers
      listen: [
        '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
        '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
      ]
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
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
        ]
      })
    ]
  })

  // UI elements
  const status = document.getElementById('status')
  const foundPeersTd = document.querySelector('#output .found-peers')
  const connectedPeersTd = document.querySelector('#output .connected-peers')

  // Listen for new peers
  libp2p.addEventListener('peer:discovery', (evt) => {
    foundPeersTd.textContent = '' + ++foundPeers
    const peer = evt.detail
    console.info(`Found peer ${peer.id.toString()}`)
  })

  // Listen for new connections to peers
  libp2p.connectionManager.addEventListener('peer:connect', (evt) => {
    connectedPeersTd.textContent = '' + ++connectedPeers
    const connection = evt.detail
    console.info(`Connected to ${connection.remotePeer.toString()}`)
  })

  // Listen for peers disconnecting
  libp2p.connectionManager.addEventListener('peer:disconnect', (evt) => {
    connectedPeersTd.textContent = '' + --connectedPeers
    const connection = evt.detail
    console.info(`Disconnected from ${connection.remotePeer.toString()}`)
  })

  await libp2p.start()
  const peerIdStr = libp2p.peerId.toString()
  status.innerText = `libp2p started! peerId: ${peerIdStr}`
  console.info(`libp2p id is ${peerIdStr}`)

  // Export libp2p to the window so you can play with the API
  window.libp2p = libp2p
})
