const config = {
  NODE_EVENTS: ['tx', 'bp', 'block', 'fork', 'query'], // events consumed by node

  W3_EVENTS: [ // events consumed by w3dashboard
    'network.msg.departure', 'network.msg.arrival', 'network.ready',
    'chain.block.added', 'chain.fork',
    'node.verify'
  ], // events consumed by w3

  NODES_AMOUNT: 2**8,
  COLLECTORS_AMOUNT: 2,
  WITNESSES_AMOUNT: 2,
  WITNESS_ROUNDS_AMOUNT: 2,
  TX_COUNT: 100,
  INIT_CHAIN_INTERVAL: 10000, // 10秒

  MSG_ARRIVAL_RATIO: 1, // the ratio is always 1 in a P2P network using TCP as transportation protocol,
  LATENCY_LOWER_BOUND: 0,
  LATENCY_UPPER_BOUND: 100, // 100 milliseconds,
  LOCAL_COMPUTATION_LATENCY: 30, // 20 milliseconds,

  WITNESS_AND_MINT_LATENCY: 4 * (100 + 30), // 4 rounds * (latency + local computation latency), // @see design/w3-node-activies-and-messages.png
  UNCONFIRMED_BLOCKS_HEIGHT: 0, // the height from tail of a chain to the head of unconfirmed _blocks

  /**
   * singleNodeMode true means in single node network mode, when only the node (i === 0) solely collect, witness and mint
   * by set Node in singleNodeMode, we can easly write and debug the fundamental block building logics without
   * disturbing from collaboration logics
   */
  SINGLE_NODE_MODE: false,
  W3_EVENTS_ON: false
}

export { config }
