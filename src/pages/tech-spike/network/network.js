import { EventEmitter } from 'events'

class Network extends EventEmitter {
  constructor({ packetLossRate = 0 }) {
    super()
    this._listeners = {}

    this.packetLossRate = packetLossRate
  }

  emit(eventName, ...args) {
    if (this._listeners[eventName]) {
      for (let listener of this._listeners[eventName])
        if (Math.random() > this.packetLossRate) listener(...args)
    }
    return true
  }

  on(eventName, listener) {
    if (!this._listeners[eventName]) this._listeners[eventName] = []
    this._listeners[eventName].push(listener)
    return this
  }
}

export default new Network({})
