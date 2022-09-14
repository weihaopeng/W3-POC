import network from './controller.js'
import controller from './controller.js'
import { v1 as uuidV1 } from 'uuid'

async function sleep(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

class Swarm {
  constructor({ nodes }) {
    this.id = uuidV1()
    this.nodes = nodes

    network.on('network.swarm.msg', (data) => {
      if (data.from.id === this.id) return
      this.receiveMessage(data)
    })
  }

  get randomNode() {
    return this.nodes[Math.floor(Math.random() * this.nodes.length)]
  }

  async receiveMessage(data) {
    await sleep(Math.random() * 200)
    const arriveNode = this.randomNode
    controller.emit('network.swarm.msg.arrival', {
      ...data,
      to: { id: this.id, address: arriveNode.address, ip: arriveNode.ip },
      arrivalTime: new Date(),
      nodesTotal: this.nodes.length,
    })
  }

  async broadcastMessage(data) {
    // await sleep(Math.random()*200);
    const departNode = this.randomNode
    controller.emit('network.swarm.msg.departure', {
      ...data,
      from: {
        id: this.id,
        address: departNode.address,
        ip: departNode.ip,
        isAttacker: departNode.isAttacker,
      },
      departureTime: new Date(),
    })
    network.emit('network.swarm.msg', {
      ...data,
      from: {
        id: this.id,
        address: departNode.address,
        ip: departNode.ip,
        isAttacker: departNode.isAttacker,
      },
      departureTime: new Date(),
    })
  }
}

export default Swarm
