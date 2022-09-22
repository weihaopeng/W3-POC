import { ref, computed } from "vue";
import { W3Swarm } from '@/w3/poc/w3.swarm.js'
import { util } from '@/w3/util.js'
import { Transaction } from '@/w3/core/entities/transaction.js'
import { Block } from '@/w3/core/entities/block.js'

export default function (height, w3, playing) {
  const NODES_AMOUNT = 5
  const WITNESSES_AMOUNT = 1
  const COLLECTORS_AMOUNT = 1
  const LATENCY_LOWER_BOUND = 2500
  const LATENCY_UPPER_BOUND = 3000
  const LOCAL_COMPUTATION_LATENCY = 1000

  const swarmInit = async () => {
    const config = {
      NODES_AMOUNT,
      LATENCY_LOWER_BOUND,
      LATENCY_UPPER_BOUND,
      WITNESSES_AMOUNT,
      COLLECTORS_AMOUNT,
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
    const txs = []
    for (let i = 0; i < 3; i++) {
      if (!playing.value) break;
      const randomIndex = Math.random() < 0.5 ? 1 : 4;
      const tx = w3.value.createFakeTx(j)
      txs.push(tx)
      const from = w3.value.nodes[randomIndex]
      w3.value.emitW3EventMsgDeparture({ event: 'tx', data: tx, origin: from, target: null })
      j++
      const otherNodes = w3.value.nodes.filter((node, index) => index !== randomIndex)
      
      otherNodes.map((node) => {
        const arriveLatency = util.gaussRandom(LATENCY_LOWER_BOUND, LATENCY_UPPER_BOUND)
        setTimeout(() => {
          w3.value.emitW3EventMsgArrival({ event: 'tx', data: tx, origin: from, target: node })
          if (node === collectorNode) {
            if (i === 0) w3.value.emitW3Event('node.role', { role: 'collector', node, data: tx })

            const verifyLatency = util.gaussRandom(1000, LOCAL_COMPUTATION_LATENCY)
            setTimeout(() => {
              w3.value.emitW3Event('node.verify', { type: 'tx', data: tx, node, valid: true })
            }, verifyLatency)
          }
        }, arriveLatency)
        
      })
      await sleep(LATENCY_UPPER_BOUND + LOCAL_COMPUTATION_LATENCY + 1300); // 1000 for valid view timeout and 300 for remove animation.
    }

    let bp
    for (let i = 0; i < 2; i++) {
      if (!playing.value) break;
      const index = i === 0 ? 3 : 2;
      const witnessIndex = i === 0 ? 2 : 0;
      const from = w3.value.nodes[index]
      const witnessNode = w3.value.nodes[witnessIndex]
      if (i === 0) bp = from.createBlockProposal(txs)
      else bp.askForWitness(from)
      w3.value.emitW3EventMsgDeparture({ event: 'bp', data: bp, origin: from })
      const otherNodes = w3.value.nodes.filter((node, i) => i !== index)

      otherNodes.map((node) => {
        const arriveLatency = util.gaussRandom(LATENCY_LOWER_BOUND, LATENCY_UPPER_BOUND)
        setTimeout(async () => {
          w3.value.emitW3EventMsgArrival({ event: 'bp', data: bp, origin: from, target: node })
          if (node === witnessNode) {
            await bp.witness(node)
            w3.value.emitW3Event('node.role', { role: 'witness', node, data: bp })

            const verifyLatency = util.gaussRandom(1000, LOCAL_COMPUTATION_LATENCY)
            setTimeout(() => {
              w3.value.emitW3Event('node.verify', { type: 'bp', data: bp, node, valid: true })
            }, verifyLatency)
          }
        }, arriveLatency)
        
      })
      await sleep(LATENCY_UPPER_BOUND + LOCAL_COMPUTATION_LATENCY + 1300);
    }

    const lastWitnessIndex = 0;
    const lastWitness = w3.value.nodes[lastWitnessIndex]
    const block = Block.mint(bp, lastWitness.epoch.tailHash)
    if (playing.value) {
      w3.value.emitW3EventMsgDeparture({ event: 'block', data: block, origin: lastWitness })
      const otherNodes = w3.value.nodes.filter((node, i) => i !== lastWitnessIndex)

      otherNodes.map((node) => {
        const arriveLatency = util.gaussRandom(LATENCY_LOWER_BOUND, LATENCY_UPPER_BOUND)
        setTimeout(() => {
          w3.value.emitW3EventMsgArrival({ event: 'block', data: block, origin: lastWitness, target: node })
          const verifyLatency = util.gaussRandom(1000, LOCAL_COMPUTATION_LATENCY)
          setTimeout(() => {
            w3.value.emitW3Event('node.verify', { type: 'block', data: block, node, valid: true })
          }, verifyLatency)
        }, arriveLatency)
        
      })
      await sleep(LATENCY_UPPER_BOUND + LOCAL_COMPUTATION_LATENCY + 1300);
    }

    if (playing.value) {
      w3.value.emitW3Event('chain.block.added', { data: block })
    }
  }

  return {
    swarmInit,
    swarmExecute
  }
}
