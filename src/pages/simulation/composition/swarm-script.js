import { ref, reactive } from "vue";
import { W3Network, W3Swarm } from '@/w3/poc/index.js'
import { util } from '@/w3/util.js'
import { Transaction } from '@/w3/core/entities/transaction.js'
import { Block } from '@/w3/core/entities/block.js'

const state = reactive({
  connectedPeers: 0,
  foundPeers: 0,
  status: 'Starting libp2p',
  mint: false,
  remoteSwarms: [],
})

export default function (height, w3, playing) {
  const NODES_AMOUNT = 5
  const WITNESSES_AMOUNT = 1
  const COLLECTORS_AMOUNT = 1
  const LATENCY_LOWER_BOUND = 2500
  const LATENCY_UPPER_BOUND = 3000
  const LOCAL_COMPUTATION_LATENCY = 1000

  let network
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
    network = new W3Network(w3.value, state)
    network.init().then(_ => console.log('*** network initialized ***'))
    return w3.value.config
  }

  const syncConfig = () => {
    const briefNodes = w3.value.nodes.map((node) => {
      return {
        address: node.account.addressString,
        i: node.i,
        publicKey: node.account.publicKeyString
      }
    })
    w3.value.emitW3Event('swarm:init', { nodes: briefNodes, config: w3.value.config })
    w3.value.emit('swarm:init', {
      origin: { type: 'swarm', peerId: network.libp2p.peerId.toString() },
      data: { nodes: briefNodes, config: w3.value.config },
    })
  }

  const sleep = (time) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve('done'), time)
    });
  }

  const mockBlockAndBp = async (nodes, n = 42) => {
    for (const node of nodes) {
      const w3Node = w3.value.nodes.find((n) => n.i === node.i)
      w3Node.account.addressString = node.address
      w3Node.account.publicKeyString = node.publicKey
    }

    const mockChainBlocks = []
    const mockBlocks = []
    const mockBps = []

    let t = 0
    for (let i = 0; i < n; i++) {
      const txs = []
      for (let j = 0; j < 3; j++) {
        const tx = w3.value.createFakeTx(t)
        txs.push(tx)
        t++
      }
      const indexList = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5)

      const collector = w3.value.nodes[indexList[0]]
      const bp = collector.createBlockProposal(txs)

      const w1 = w3.value.nodes[indexList[1]]
      mockBps.push({ type: 'bp', data: bp, from: collector.briefObj, to: w1.briefObj, arrivalTime: new Date(), role: 'witness' })
      await bp.witness(w1)

      const w2 = w3.value.nodes[indexList[2]]
      bp.askForWitness(w2)
      mockBps.push({ type: 'bp', data: bp, from: w1.briefObj, to: w2.briefObj, arrivalTime: new Date(), role: 'witness' })
      await bp.witness(w2)

      const block = Block.mint(bp, w2.epoch.tailHash)
      mockBlocks.push({ type: 'block', data: block, from: w2.briefObj })

      if (Math.random() > 0.5) {
        mockChainBlocks.push({ type: 'chain', data: block })
        for (const node of w3.value.nodes) {
          node.chain.addOrReplaceBlock(block, 'mintBlock')
        }
      }
    }

    return {
      mockChainBlocks,
      mockBlocks,
      mockBps
    }
  }

  const swarmExecute = async () => {
    playing.value = true
    w3.value.emit('swarm:play', { origin: { type: 'swarm', peerId: network.libp2p.peerId.toString() } })
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
      w3.value.emit('swarm:msg', { origin: { type: 'swarm', peerId: network.libp2p.peerId.toString() }, data: { data: tx, type: 'tx', from: from.briefObj, to: null, departureTime: new Date() } })
      j++
      const otherNodes = w3.value.nodes.filter((node, index) => index !== randomIndex)
      
      otherNodes.map((node) => {
        const arriveLatency = util.gaussRandom(LATENCY_LOWER_BOUND, LATENCY_UPPER_BOUND)
        setTimeout(() => {
          const role = (node === collectorNode ? 'collector' : null)
          // w3.value.emitW3EventMsgArrival({ event: 'tx', data: tx, origin: from, target: node, role })
          w3.value.emitW3Event('network.msg.arrival', {
            type: 'tx', data: tx, from: from.briefObj, to: node.briefObj, arrivalTime: new Date(), role
          })
          w3.value.emit('swarm:msg', { origin: { type: 'swarm', peerId: network.libp2p.peerId.toString() }, data: { data: tx, type: 'tx', from: from.briefObj, to: node.briefObj, arrivalTime: new Date(), role } })
          if (node === collectorNode) {
            const verifyLatency = util.gaussRandom(1000, LOCAL_COMPUTATION_LATENCY)
            setTimeout(() => {
              w3.value.emitW3Event('node.verify', { type: 'tx', data: tx, node, valid: true })
              w3.value.emit('node.verify', { origin: { type: 'swarm', peerId: network.libp2p.peerId.toString() }, data: { type: 'tx', data: tx, node: node.briefObj, valid: true } })
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
      w3.value.emit('swarm:msg', { origin: { type: 'swarm', peerId: network.libp2p.peerId.toString() }, data: { data: bp, type: 'bp', from: from.briefObj, to: null, departureTime: new Date() } })
      const otherNodes = w3.value.nodes.filter((node, i) => i !== index)
      otherNodes.map((node) => {
        const arriveLatency = util.gaussRandom(LATENCY_LOWER_BOUND, LATENCY_UPPER_BOUND)
        setTimeout(async () => {
          const role = (node === witnessNode ? 'witness' : null)
          // w3.value.emitW3EventMsgArrival({ event: 'bp', data: bp, origin: from, target: node, role })
          w3.value.emitW3Event('network.msg.arrival', {
            type: 'bp', data: bp, from: from.briefObj, to: node.briefObj, arrivalTime: new Date(), role
          })
          w3.value.emit('swarm:msg', { origin: { type: 'swarm', peerId: network.libp2p.peerId.toString() }, data: { data: bp, type: 'bp', from: from.briefObj, to: node.briefObj, arrivalTime: new Date(), role } })
          if (node === witnessNode) {
            await bp.witness(node)
            const verifyLatency = util.gaussRandom(1000, LOCAL_COMPUTATION_LATENCY)
            setTimeout(() => {
              w3.value.emitW3Event('node.verify', { type: 'bp', data: bp, node, valid: true })
              w3.value.emit('node.verify', { origin: { type: 'swarm', peerId: network.libp2p.peerId.toString() }, data: { type: 'bp', data: bp, node: node.briefObj, valid: true } })
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
      w3.value.emit('swarm:msg', { origin: { type: 'swarm', peerId: network.libp2p.peerId.toString() }, data: { data: block, type: 'block', from: lastWitness.briefObj, to: null, departureTime: new Date() } })
      const otherNodes = w3.value.nodes.filter((node, i) => i !== lastWitnessIndex)

      otherNodes.map((node) => {
        const arriveLatency = util.gaussRandom(LATENCY_LOWER_BOUND, LATENCY_UPPER_BOUND)
        setTimeout(() => {
          w3.value.emitW3EventMsgArrival({ event: 'block', data: block, origin: lastWitness, target: node })
          w3.value.emit('swarm:msg', { origin: { type: 'swarm', peerId: network.libp2p.peerId.toString() }, data: { data: block, type: 'block', from: lastWitness.briefObj, to: node.briefObj, arrivalTime: new Date() } })
          const verifyLatency = util.gaussRandom(1000, LOCAL_COMPUTATION_LATENCY)
          setTimeout(() => {
            w3.value.emitW3Event('node.verify', { type: 'block', data: block, node, valid: true })
            w3.value.emit('node.verify', { origin: { type: 'swarm', peerId: network.libp2p.peerId.toString() }, data: { type: 'block', data: block, node: node.briefObj, valid: true } })
          }, verifyLatency)
        }, arriveLatency)
        
      })
      await sleep(LATENCY_UPPER_BOUND + LOCAL_COMPUTATION_LATENCY + 1300);
    }

    if (playing.value) {
      w3.value.emitW3Event('chain.block.added', { data: block })
      w3.value.emit('chain.block.added', { origin: { type: 'swarm', peerId: network.libp2p.peerId.toString() }, data: { data: block } })
    }
    w3.value.emit('swarm:stop', { origin: { type: 'swarm', peerId: network.libp2p.peerId.toString() } })
  }

  return {
    state,
    swarmInit,
    swarmExecute,
    mockBlockAndBp,
    syncConfig
  }
}
