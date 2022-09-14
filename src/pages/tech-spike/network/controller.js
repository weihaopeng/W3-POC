import Node from './Node.js'
import { v1 as uuidV1 } from 'uuid'
import _ from 'lodash'
import { EventEmitter } from 'events'
import addressTool from './util/address.js'
import Swarm from './Swarm.js'

const redrawNetworkDebounce = _.throttle((chart, data) => {
  chart.setOption({
    series: [{ data }],
  })
}, 2000)

class Controller extends EventEmitter {
  constructor() {
    super()
    this._listeners = {}

    this.honestNodes = []
    this.attackerNodes = []
    this.messages = []
    this.networkChartData = []
    this.performanceChartOutboundData = []
    this.performanceChartInboundData = []
    this.performanceWithAttackerChartOutboundData = []
    this.cpuData = []
    this.memoryData = []
    this.bandwidthData = []
    this.tps = 0

    setInterval(() => {
      this._redrawPerformance()
      this._redrawCPU()
    }, 1000)
  }

  emit(eventName, ...args) {
    if (this._listeners[eventName]) {
      for (let listener of this._listeners[eventName]) listener(...args)
    }
    return true
  }

  on(eventName, listener) {
    if (!this._listeners[eventName]) this._listeners[eventName] = []
    this._listeners[eventName].push(listener)
    return this
  }

  get nodes() {
    return _.concat(this.honestNodes, this.attackerNodes)
  }

  initChart({ networkChart, performanceChart, performanceWithAttackerChart, memoryChart }) {
    if (networkChart) this.networkChart = networkChart
    if (performanceChart) this.performanceChart = performanceChart
    if (performanceWithAttackerChart) this.performanceWithAttackerChart = performanceWithAttackerChart
    if (memoryChart) this.memoryChart = memoryChart
    this._redrawNetwork()
  }

  _redrawCPU() {

    const now = Date.now()
    const cpuUsage = 10 * Math.random();
    const memoryUsage = 10 + 10 * Math.random();
    const bandwidthUsage = 20 + 10 * Math.random();

    if (this.cpuData.length > 600) this.cpuData.shift()
    if (this.memoryData.length > 600) this.memoryData.shift()
    if (this.bandwidthData.length > 600) this.bandwidthData.shift()

    this.cpuData.push({ name: now.toString(), value: [new Date(), cpuUsage] })
    this.memoryData.push({
      name: now.toString(),
      value: [new Date(), memoryUsage],
    })
    this.bandwidthData.push({
      name: now.toString(),
      value: [new Date(), bandwidthUsage],
    })
    this.memoryChart && this.memoryChart.setOption({
      series: [
        { data: this.cpuData },
        { data: this.memoryData },
        { data: this.bandwidthData },
      ],
    })
  }

  _redrawPerformance() {
    if (!this.performanceChart || !this.performanceWithAttackerChart) return
    const now = Date.now()

    const departureMessagesLastSec = this.tps * (this.nodes.length - 1)
    const attackerDepartureMessagesLastSec = Math.round(
      departureMessagesLastSec * (this.attackerNodes.length / this.nodes.length)
    )
    const arrivalMessagesLastSec = Math.round(
      departureMessagesLastSec * (0.9 + Math.random() * 0.2)
    )

    if (this.performanceChartOutboundData.length > 600)
      this.performanceChartOutboundData.shift()
    if (this.performanceChartInboundData.length > 600)
      this.performanceChartInboundData.shift()
    if (this.performanceWithAttackerChartOutboundData.length > 600)
      this.performanceWithAttackerChartOutboundData.shift()

    this.performanceChartOutboundData.push({
      name: now.toString(),
      value: [new Date(), departureMessagesLastSec],
    })
    this.performanceWithAttackerChartOutboundData.push({
      name: now.toString(),
      value: [new Date(), attackerDepartureMessagesLastSec],
    })
    this.performanceChartInboundData.push({
      name: now.toString(),
      value: [new Date(), arrivalMessagesLastSec],
    })
    this.performanceChart && this.performanceChart.setOption({
      series: [
        { data: this.performanceChartInboundData },
        { data: this.performanceChartOutboundData },
      ],
    })
    this.performanceWithAttackerChart && this.performanceWithAttackerChart.setOption({
      series: [
        { data: this.performanceChartOutboundData },
        { data: this.performanceWithAttackerChartOutboundData },
      ],
    })
  }

  _redrawNetwork() {
    if (!this.networkChart) return
    this.networkChartData = []
    for (let swarm of this.swarms) {
      const nodes = swarm.nodes
      let departNodesTotal = Math.floor(this.tps / this.swarms.length)
      departNodesTotal =departNodesTotal < 5 ? 5 : departNodesTotal > 10 ? 10 : departNodesTotal
      const departNodes = _.sampleSize(nodes, departNodesTotal)
      for (let departNode of departNodes) {
        for (let arriveNode of nodes) {
          if (departNode.address === arriveNode.address) continue
          const { longitude: lng1, latitude: lat1 } = addressTool.ip2LngLat(departNode.ip)
          const { longitude: lng2, latitude: lat2 } = addressTool.ip2LngLat(arriveNode.ip)
          this.networkChartData.push({
            from: [lng1, lat1],
            to: [lng2, lat2],
            isAttackMsg: departNode.isAttacker,
          })
        }
      }
    }

    for (let departSwarm of this.swarms) {
      const departNodes = _.sampleSize(departSwarm.nodes, 3)

      for (let arriveSwarm of this.swarms) {
        if (departSwarm.id === arriveSwarm.id) continue

        const arriveNodes = _.sampleSize(arriveSwarm.nodes, 3)
        for (let departNode of departNodes) {
          for (let arriveNode of arriveNodes) {
            if (departNode.address === arriveNode.address) continue
            const { longitude: lng1, latitude: lat1 } = addressTool.ip2LngLat(departNode.ip)
            const { longitude: lng2, latitude: lat2 } = addressTool.ip2LngLat(arriveNode.ip)
            this.networkChartData.push({
              from: [lng1, lat1],
              to: [lng2, lat2],
              isAttackMsg: departNode.isAttacker,
            })
          }
        }
      }
    }

    const generatedData = this.networkChartData.map((d) => {
      return {
        coords: [d.from, d.to],
        lineStyle: { color: d.isAttackMsg ? 'red' : 'rgb(50, 50, 150)' },
        opacity: 0.05
      }
    })
    redrawNetworkDebounce(this.networkChart, generatedData)
  }

  _drawTx({ arrivalTime, from, to, isAttackMsg }) {
    const isTxLineExist = this.networkChartData.find((data) => (data.from === from && data.to === to))
    if (isTxLineExist) {
      isTxLineExist.arrivalTime = arrivalTime
    } else {
      const chartDataLength = this.networkChartData.length
      this.networkChartData.unshift({ arrivalTime, from, to, isAttackMsg })
      this.networkChartData = _.uniqBy(this.networkChartData, (data) => (data.from + data.to))
      if (chartDataLength < this.networkChartData.length) this._redrawNetwork()
    }
  }

  generateNetwork(honestScale, attackerScale) {
    if (honestScale > 0 && honestScale !== this.honestNodes.length) {
      if (honestScale > this.honestNodes.length) {
        while (this.honestNodes.length < honestScale)
          this.honestNodes.push(new Node({ address: uuidV1().toString() }))
      } else {
        while (this.honestNodes.length > honestScale) this.honestNodes.pop()
      }
    }

    if (attackerScale > 0 && attackerScale !== this.attackerNodes.length) {
      if (attackerScale > this.attackerNodes.length) {
        while (this.attackerNodes.length < attackerScale)
          this.attackerNodes.push(new Node({ address: uuidV1().toString(), isAttacker: true }))
      } else {
        while (this.attackerNodes.length > attackerScale)
          this.attackerNodes.pop()
      }
    }

    const nodesTotal = honestScale + attackerScale
    const swarmsTotal = Math.ceil(nodesTotal / 100)
    const chunkSize = Math.sqrt(swarmsTotal)
    const lngChunkSize = chunkSize > Math.floor(chunkSize) ? Math.ceil(chunkSize) : chunkSize
    const lngChunkRange = 360 / lngChunkSize
    const latChunkSize = Math.floor(chunkSize)
    const latChunkRange = 180 / latChunkSize
    const swarms = Array(lngChunkSize).fill('').map(() => Array(latChunkSize).fill('').map(() => []))
    for (let node of this.nodes) {
      swarms[Math.floor((node.longitude + 180) / lngChunkRange)][Math.floor((node.latitude + 90) / latChunkRange)].push(node);
      node.swarm = swarms[Math.floor((node.longitude + 180) / lngChunkRange)][Math.floor((node.latitude + 90) / latChunkRange)];
    }
    this.swarms = _.filter(_.flatten(swarms), (s) => s.length > 0).map((nodes) => (new Swarm({ nodes })))
  }

  setNodesScale(honestScale, attackerScale) {
    console.log('set honest node scale num', honestScale, attackerScale)
    this.generateNetwork(honestScale, attackerScale)
    this._redrawNetwork()
  }

  async _broadcastTxs(num) {
    let nodes = []
    if (num > 10) num = 10 // limit actual events
    while (num > 0) {
      nodes = _.concat(nodes, _.slice(this.nodes, 0, num))
      num -= this.nodes.length
    }
  }

  autoGenerateTx(tps) {
    this.tps = tps
    this.timer && clearInterval(this.timer)
    if (tps === 0) return

    this.timer = setInterval(() => {
      this._broadcastTxs.bind(this)(tps)
    }, 1000)
  }

  stopGenerateTx() {
    if (this.timer) clearInterval(this.timer)
  }
}

export default new Controller()
