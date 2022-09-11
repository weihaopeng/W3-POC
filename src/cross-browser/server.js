// [Reference]
// - https://github.com/libp2p/js-libp2p/blob/master/examples/webrtc-direct/listener.js
// [Note]
// - this server code has been distributed at server 3.112.126.56

import { createLibp2p } from 'libp2p'
import { WebRTCDirect } from '@libp2p/webrtc-direct'
import { Mplex } from '@libp2p/mplex'
import { Noise } from '@chainsafe/libp2p-noise'
import { createFromJSON } from '@libp2p/peer-id-factory'
import wrtc from 'wrtc'

async function run() {
  const predefinedPeerId = await createFromJSON({
    id: '12D3KooWCuo3MdXfMgaqpLC5Houi1TRoFqgK9aoxok4NK5udMu8m',
    privKey:
      'CAESQAG6Ld7ev6nnD0FKPs033/j0eQpjWilhxnzJ2CCTqT0+LfcWoI2Vr+zdc1vwk7XAVdyoCa2nwUR3RJebPWsF1/I=',
    pubKey: 'CAESIC33FqCNla/s3XNb8JO1wFXcqAmtp8FEd0SXmz1rBdfy'
  })

  const node = await createLibp2p({
    peerId: predefinedPeerId,
    addresses: {
      listen: ['/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct']
    },
    transports: [new WebRTCDirect({ wrtc })],
    streamMuxers: [new Mplex()],
    connectionEncryption: [new Noise()]
  })

  node.connectionManager.addEventListener('peer:connect', (e) => {
    console.info(`Connected to ${e.detail.remotePeer.toString()}!`)
  })

  await node.start()

  console.log('Listening on:')
  node.getMultiaddrs().forEach((item) => console.log(item.toString()))
}

run()
