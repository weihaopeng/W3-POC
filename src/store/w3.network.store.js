import { reactive, readonly } from 'vue'
import { W3Network, W3Swarm } from '../w3/poc/index.js'
import { config } from '../w3/poc/config.default.js'

const state = reactive({
  connectedPeers: 0,
  foundPeers: 0,
  status: 'Starting libp2p',
  mint: false,
})


const NODES_AMOUNT = 16, TX_COUNT = 30,   COLLECTORS_AMOUNT = 2, WITNESSES_AMOUNT = 2
const tps = TX_COUNT / (config.EPOCH_TIME / 1000) // @see design/w3-node-activities-and-messages.png
const txAmount = Math.ceil(100 * tps)

const swarm = new W3Swarm({ NODES_AMOUNT, W3_EVENTS_ON: true })

const startTwoStagesMint = async () => {
  state.mint = true
  await swarm.init()
  return swarm.sendFakeTxs(txAmount, 2 * tps)
}

const stopTwoStagesMint = async () => {
  state.mint = false
  await swarm.destroy(true)
}

const network = new W3Network(swarm, state)
network.init().then(_ => console.log('*** network initialized ***'))


export default { state: readonly (state), network, swarm, startTwoStagesMint, stopTwoStagesMint }
