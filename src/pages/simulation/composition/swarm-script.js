import { ref, computed } from "vue";
import { W3Swarm } from '@/w3/poc/w3.swarm.js'
import { util } from '@/w3/util.js'
import { Transaction } from '@/w3/core/entities/transaction.js'

export default function (height, w3, playing) {
  const NODES_AMOUNT = 5
  const LATENCY_LOWER_BOUND = 2500
  const LATENCY_UPPER_BOUND = 3000
  const LOCAL_COMPUTATION_LATENCY = 1000

  const swarmInit = async () => {
    const config = {
      NODES_AMOUNT,
      LATENCY_LOWER_BOUND,
      LATENCY_UPPER_BOUND,
      LOCAL_COMPUTATION_LATENCY,
      W3_EVENTS_ON: true,
      WITNESS_AND_MINT_LATENCY: 4 * (LATENCY_UPPER_BOUND + LOCAL_COMPUTATION_LATENCY),
      UNCONFIRMED_BLOCKS_HEIGHT: 0,

      EPOCH_TIME: 17 * (LATENCY_UPPER_BOUND + LOCAL_COMPUTATION_LATENCY),
      EPOCH_COLLECTING_TIME: 13 * (LATENCY_UPPER_BOUND + LOCAL_COMPUTATION_LATENCY),
      EPOCH_WITNESS_AND_MINT_TIME: 4 * (LATENCY_UPPER_BOUND + LOCAL_COMPUTATION_LATENCY),
    }
    w3.value = new W3Swarm(config)
    await w3.value.init(5)
    w3.value.reset(height)
    console.log(w3.value)
    return w3.value.config
  }

  const sleep = (time) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve('done'), time)
    });
  }

  const swarmExecute = async () => {
    playing.value = true
    let j = 0
    const collectorNode = w3.value.nodes[3]
    for (let i = 0; i < 3; i++) {
      if (!playing.value) break;
      const randomIndex = Math.random() < 0.5 ? 1 : 4;
      const tx = w3.value.createFakeTx(j)
      const from = w3.value.nodes[randomIndex]
      w3.value.emitW3EventMsgDeparture({ event: 'tx', data: tx, origin: from, target: null })
      j++
      const otherNodes = w3.value.nodes.filter((node, index) => index !== randomIndex)
      
      otherNodes.map((node) => {
        const arriveLatency = util.gaussRandom(LATENCY_LOWER_BOUND, LATENCY_UPPER_BOUND)
        setTimeout(() => {
          w3.value.emitW3EventMsgArrival({ event: 'tx', data: tx, origin: from, target: node })
          const verifyLatency = util.gaussRandom(1000, LOCAL_COMPUTATION_LATENCY)
          if (node === collectorNode) {
            setTimeout(() => {
              w3.value.emitW3Event('node.verify', { type: 'tx', data: tx, node: node, valid: true })
            }, verifyLatency)
          }
        }, arriveLatency)
        
      })
      await sleep(LATENCY_UPPER_BOUND + LOCAL_COMPUTATION_LATENCY + 1000);
    }
    for (let i = 0; i < 2; i++) {
      if (!playing.value) break;
    }
  }

  return {
    swarmInit,
    swarmExecute
  }
}
