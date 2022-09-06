import MessageMaker from './MessageMaker.js'
import nodes from './MockNodes.json'
import MessageHandler from './MessageHandler.js'
import ChainPainter from './painter/ChainPainter.js'
import BlockPainter from './painter/BlockPainter.js'
import SwarmPainter from './painter/SwarmPainter.js'
import BpPainter from './painter/BpPainter.js'

async function fetchHistory(messageMaker) {
  // for (let i = 0; i < Math.ceil(Math.random() * 10); i++) {
  // }
}

async function main() {
  const bpPainter = new BpPainter(document.getElementById('bp-container'))
  const swarmPainter = new SwarmPainter(document.getElementById('swarm-container'), nodes)
  swarmPainter.init()
  const blockPainter = new BlockPainter(document.getElementById('block-container'))
  const chainPainter = new ChainPainter(document.getElementById('chain-container'))
  const messageHandler = new MessageHandler({ chainPainter, blockPainter, swarmPainter, bpPainter })
  const messageMaker = new MessageMaker({ handler: messageHandler, nodes })
  await fetchHistory(messageMaker)
  setTimeout(() => {
    messageMaker.work(5)
  }, 1000)
}

main()
