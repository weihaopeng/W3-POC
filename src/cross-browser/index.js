// [Reference]
// - https://github.com/libp2p/js-libp2p/blob/master/examples/webrtc-direct/dialer.js

import { createLibp2p } from 'libp2p'
import { WebRTCDirect } from '@libp2p/webrtc-direct'
import { Mplex } from '@libp2p/mplex'
import { Noise } from '@chainsafe/libp2p-noise'
import { Bootstrap } from '@libp2p/bootstrap'

document.addEventListener('DOMContentLoaded', run)

async function run() {
  const libp2p = await createLibp2p({
    transports: [new WebRTCDirect()],
    streamMuxers: [new Mplex()],
    connectionEncryption: [new Noise()],
    peerDiscovery: [
      new Bootstrap({
        list: [
          `/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct/p2p/12D3KooWCuo3MdXfMgaqpLC5Houi1TRoFqgK9aoxok4NK5udMu8m`
        ]
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

  await libp2p.start()
  console.info(`libp2p id is ${libp2p.peerId.toString()}`)
}
