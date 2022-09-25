import addressTool from './address.js'
import network from './controller.js'
import controller from './controller.js'

async function sleep(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

class Node {
  constructor({ address, ip, latitude, longitude, isAttacker = false }) {
    if (!address) throw new Error('Please init from an unique address')
    this.address = address
    this.isAttacker = isAttacker
    this.swarm = null
    if (!ip) {
      this.ip = addressTool.randomIp()
      Object.assign(this, addressTool.ip2LngLat(this.ip))
    } else {
      this.ip = ip
      if (!latitude || !longitude)
        Object.assign(this, addressTool.ip2LngLat(this.ip))
      else Object.assign(this, { latitude, longitude })
    }

    network.on('network.msg', (data) => {
      if (data.from.address === this.address) return
      this.receiveMessage(data)
    })
  }

  async receiveMessage(data) {
    await sleep(Math.random() * 200)
    controller.emit('network.msg.arrival', {
      ...data,
      to: { address: this.address, ip: this.ip },
      arrivalTime: new Date(),
    })
  }

  async broadcastMessage(data) {
    await sleep(Math.random() * 200)
    controller.emit('network.msg.departure', {
      ...data,
      from: { address: this.address, ip: this.ip, isAttacker: this.isAttacker },
      departureTime: new Date(),
    })
    network.emit('network.msg', {
      ...data,
      from: {
        address: this.address,
        ip: this.ip,
        isAttacker: this.isAttacker,
        swarmId: this.swarm.id,
      },
      departureTime: new Date(),
    })
  }
}

export default Node
