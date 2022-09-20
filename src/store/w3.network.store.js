import { reactive, readonly } from 'vue'
import { W3Network } from '../w3/poc/index.js'

const state = reactive({
  connectedPeers: 0,
  foundPeers: 0,
  network: null,
})


const network = new W3Network()
network.init(null, state)


export default { state: readonly (state), network }
