import { getRandomNode, getRandomNodeWithout, getOtherNodes } from './util'
const DELAY_FOR_VIEW = 2000 // 基础通信耗时
const DELAY_CHURN_THRESHOLD = 200 // 波动产生的额外时间
const DELAY_FILTER_RATIO = 0.2 // 因波动进行过滤的节点比例

class MessageMaker {
  /**
   * A mock message maker for tech spike. xxInterval means interval between two random messages with same type. The unit is milliseconds.
   * For the convenience of use in spike, the handler is directly injected into the call instead of communicating through sockets.
   * @param { number } txInterval
   * @param { number } pbInterval
   * @param { number } blockInterval
   * @param { number } afwInterval
   * @param { MessageHandler } handler
   */
  constructor({ txInterval, pbInterval, blockInterval, afwInterval, handler, nodes }) {
    this.txInterval = txInterval || 100
    this.pbInterval = pbInterval || 100
    this.blockInterval = blockInterval || 100
    this.afwInterval = afwInterval || 100
    this.handler = handler
    this.nodes = nodes
  }

  generateTxMessage() {
    const from = getRandomNode(this.nodes)
    const to = getRandomNodeWithout(this.nodes, from.id)
    const data = {
      from,
      to,
      data: { content: 'A mock tx message' }
    }
    this.handler.handleMessage({ type: 'tx', data })
  }

  generatePbMessage() {

  }

  generateBlockMessage() {

  }

  generateAfwMessage() {

  }

  async work(count) {
    let i = 0
    while(i < count) {
      await this.workRound()
      i++
    }
    // setInterval(() => this.generateTxMessage(), this.txInterval)
  }

  broadcastToOthers(from, type, data, delay = 0, round = 0) {
    const others = getOtherNodes(this.nodes, from.id)
    for (const node of others) {
      const msg = {
        from,
        to: node,
        data
      }
      setTimeout(() => {
        this.handler.handleNetworkMessage({ type, data: msg, action: 'departure' })
      }, delay)
      let key = `${type}CommunicateCost`
      if (round) key += `${round}`
      const communicateCost = Math.floor(Math.random() * DELAY_CHURN_THRESHOLD + DELAY_FOR_VIEW)
      node[key] = communicateCost
      setTimeout(() => {
        this.handler.handleNetworkMessage({ type, data: msg, action: 'arrive' })
      }, communicateCost + delay)
    }
  }

  broadcastFromRandom() {
    const from = getRandomNode(this.nodes)
    this.broadcastToOthers(from, 'tx', { content: 'A mock tx message' })
  }

  broadcastBp(round) {
    setTimeout(() => {
      const key = round === 1 ? 'txCommunicateCost' : `bpCommunicateCost${round - 1}`
      const collectors = this.nodes.filter((node) => node[key] && node[key] < DELAY_FOR_VIEW + DELAY_CHURN_THRESHOLD * (1 - DELAY_FILTER_RATIO))
      // 实际中，多个collector会进行计算，最快的那个算完后，会发消息给到其他，其他节点接收后验算它比我的好，我的就不算了。
      // 这里为了方便模拟，随便取一个。
      const i = Math.floor(Math.random() * collectors.length)
      const collector = collectors[i]

      // for (const collector of collectors) {
      const bpCalculateCost = Math.floor(Math.random() * 500 + 500)
      collector[`bpCalculateCost${round}`] = bpCalculateCost
      let r = round
      let totalCost = 0
      while(r > 0) {
        const key = r === 1 ? 'txCommunicateCost' : `bpCommunicateCost${r - 1}`
        console.log(round, key, collector[key]) // 这个算法有问题。tx的消耗是记录在to节点的，而from节点没有。from可能是后续轮次的见证者，tx的消耗不一定会记录在后续轮的节点上。
        totalCost += collector[key]
        r--
      }
      // setTimeout(() => {
      console.log('total cost', round, totalCost)
      this.broadcastToOthers(collector, 'bp', { content: 'A mock bp message', round }, totalCost + bpCalculateCost, round)
      // }, totalCost + bpCalculateCost)
    }, 0)
  }

  broadcastBlock() {

  }

  workRound() {
    for (let node of this.nodes) {
      node = { id: node.id, name: node.name }
    }
    this.broadcastFromRandom()
    this.broadcastBp(1)
    this.broadcastBp(2)
    this.broadcastBp(3)
    this.broadcastBlock()
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let max = 0
        for (const node of this.nodes) {
          const costKeys = Object.keys(node).filter((key) => key !== 'id' && key !== 'name')
          let cost = 0
          for (const key of costKeys) {
            cost += node[key]
          }
          max = Math.max(cost, max)
        }
        console.log(max)

        setTimeout(() => {
          resolve('done')
        }, max + DELAY_FOR_VIEW)
      }, 0)
    })
  }

}

export default MessageMaker