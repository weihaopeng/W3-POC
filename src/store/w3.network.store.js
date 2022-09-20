import { reactive, readonly } from 'vue'
import { W3Network } from '../w3/poc/index.js'
import { peerIdFromString } from '@libp2p/peer-id'

const state = reactive({
  connectedPeers: 0,
  foundPeers: 0,
  network: null,
})


state.network = new W3Network()
state.network.init(null, state)


export default { state: readonly (state), network: state.network }
