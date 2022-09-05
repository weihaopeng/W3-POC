/**
 * events used in dashboard for visualization of W3
 */
const w3Events = {
  /**
   * w3内的消息传递，适合在swarm视图使用。在network视图中，性能消耗过大，不适合。
   * 绘制消息发送路径动画时，时间很重要。例如：节点在收到bp的消息之后，方可进行verify，然后才有下一轮bp消息。
   * w3 poc的设计，考虑了网络抖动（时延）变化，因此，虽然tx、bp、block、fork等消息都是broadcast的，
   * 但其传播时间不同，必须在可视化中考虑。
   */
  'network.msg': { // message delivery
    type: 'tx',  // tx | bp | block | fork
    data: {}, // corresponding data of the type
    form: {address: 'node.account.address', i: '序号便于在开发调试中识认'},
    to: {address: 'node.account.address', i: '序号便于在开发调试中识认'},
    departureTime: new Date(),
    arrivalTime: new Date(),
  },

  'chain.block_added': {
    node: {address: 'node.account.address', i: '序号便于在开发调试中识认'},
    block: {height: 23, hash: 'hash-value', i: '序号便于在开发调试中识认'}
  },

  'chain.fork': {
    node: {address: 'node.account.address', i: '序号便于在开发调试中识认'},
    fork: {TODO: 'TODO'}
  },

  'node.verify': {
    type: 'tx',  // tx | bp | block | fork
    data: {}, // corresponding data of the type
    node: {address: 'node.account.address', i: '序号便于在开发调试中识认'},
    valid: true
  },
}
