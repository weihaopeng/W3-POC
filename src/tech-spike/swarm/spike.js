import MessageSimulator from './MessageSimulator.js'
import nodes from './assets/nodes.json'
import MessageHandler from './MessageHandler.js'
import ChainPainter from './painter/ChainPainter.js'
import BlockPainter from './painter/BlockPainter.js'
import SwarmPainter from './painter/SwarmPainter.js'
import BpPainter from './painter/BpPainter.js'

async function main() {
  const bpPainter = new BpPainter(document.getElementById('bp-container'))
  const swarmPainter = new SwarmPainter(document.getElementById('swarm-node-cvs'), document.getElementById('swarm-tooltip-container'), nodes)
  swarmPainter.init()
  const blockPainter = new BlockPainter(document.getElementById('block-container'))
  const chainPainter = new ChainPainter(document.getElementById('chain-container'))
  const messageHandler = new MessageHandler({ chainPainter, blockPainter, swarmPainter, bpPainter, nodes })
  const messageSimulator = new MessageSimulator({ messageHandler, nodes });
}

main()
