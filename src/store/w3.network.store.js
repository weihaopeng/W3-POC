import { reactive, readonly } from 'vue'
import { W3Network } from '../w3/poc/index.js'

const state = reactive({
  connectedPeers: 0,
  foundPeers: 0,
  network: null,
})

const libp2pBeforeStart =   async (network) => {
  network.addEventListener('peer:discovery', (evt) => {
    const peer = evt.detail
    console.info(`Found peer ${peer.id.toString()}`)
    state.foundPeers++
  })

  // Listen for new connections to peers
  network.connectionManager.addEventListener('peer:connect', (evt) => {
    const connection = evt.detail
    console.info(`Connected to ${connection.remotePeer.toString()}`)
    state.connectedPeers++
  })

  // Listen for peers disconnecting
  network.connectionManager.addEventListener('peer:disconnect', (evt) => {
    const connection = evt.detail
    console.info(`Disconnected from ${connection.remotePeer.toString()}`)
    state.connectedPeers--
  })
}

state.network = new W3Network()
state.network.init(null, libp2pBeforeStart)


export default { state: readonly (state), network: state.network }
