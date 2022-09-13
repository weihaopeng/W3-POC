<template lang="pug">
div
  header
    h1#status Starting libp2p...
  table#output
    thead
      tr
        th Found Peers
        th Connected Peers
    tbody
      tr
        td.found-peers pending...
        td.connected-peers pending
</template>
  
<script>
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { createLibp2p } from 'libp2p'
import { WebSockets } from '@libp2p/websockets'
import { WebRTCStar } from '@libp2p/webrtc-star'
import { Noise } from '@chainsafe/libp2p-noise'
import { Mplex } from '@libp2p/mplex'
import { Bootstrap } from '@libp2p/bootstrap'

export default defineComponent({
  name: 'Libp2pExample',
  setup: () => {
    let foundPeers = 0, connectedPeers = 0
    const libp2p = ref(null)
    const working = ref(true)
    onMounted(async () => {
      const webRtcStar = new WebRTCStar()

      // Create our libp2p node
      libp2p.value = await createLibp2p({
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
      libp2p.value.addEventListener('peer:discovery', (evt) => {
        if (!working.value) return
        foundPeersTd.textContent = '' + ++foundPeers
        const peer = evt.detail
        console.info(`Found peer ${peer.id.toString()}`)
      })

      // Listen for new connections to peers
      libp2p.value.connectionManager.addEventListener('peer:connect', (evt) => {
        if (!working.value) return
        connectedPeersTd.textContent = '' + ++connectedPeers
        const connection = evt.detail
        console.info(`Connected to ${connection.remotePeer.toString()}`)
      })

      // Listen for peers disconnecting
      libp2p.value.connectionManager.addEventListener('peer:disconnect', (evt) => {
        if (!working.value) return
        connectedPeersTd.textContent = '' + --connectedPeers
        const connection = evt.detail
        console.info(`Disconnected from ${connection.remotePeer.toString()}`)
      })

      await libp2p.value.start()
      const peerIdStr = libp2p.value.peerId.toString()
      status.innerText = `libp2p started! peerId: ${peerIdStr}`
      console.info(`libp2p id is ${peerIdStr}`)

      // Export libp2p to the window so you can play with the API
      window.libp2p = libp2p.value
    })

    onBeforeUnmount(() => {
      libp2p.value.stop()
      working.value = false
    })
  }
})
</script>
