import * as echarts from 'echarts'
import 'echarts-gl'
import axios from 'axios'
import controller from './controller.js'

function renderConfig() {
  document.getElementById('commit-setting').addEventListener('click', () => {
    controller.setNodesScale(
      Number.parseInt(document.getElementById('honestScale').value),
      Number.parseInt(document.getElementById('attackerScale').value)
    )
    controller.autoGenerateTx.bind(controller)(
      document.getElementById('tps_input').value
    )
  })
}

function renderNetwork() {
  const networkChartDom = document.getElementById('network-container')

  const networkChart = echarts.init(networkChartDom)
  networkChart.setOption({
    geo3D: {
      map: 'worldCustom',
      shading: 'realistic',
      silent: true,
      environment: '#333',
      realisticMaterial: {
        roughness: 0.8,
        metalness: 0,
      },
      postEffect: {
        enable: true,
      },
      groundPlane: {
        show: false,
      },
      light: {
        main: {
          intensity: 1,
          alpha: 30,
        },
        ambient: {
          intensity: 0,
        },
      },
      viewControl: {
        distance: 70,
        alpha: 89,
        panMouseButton: 'left',
        rotateMouseButton: 'right',
        zoomSensitivity: 0,
        panSensitivity: 0,
      },
      itemStyle: {
        color: '#000',
      },
      regionHeight: 0.5,
    },
    series: [
      {
        id: 'tx',
        type: 'lines3D',
        coordinateSystem: 'geo3D',
        effect: {
          show: true,
          trailWidth: 1,
          trailOpacity: 0.5,
          trailLength: 0.2,
          constantSpeed: 5,
          // period: 1
        },
        blendMode: 'lighter',
        lineStyle: {
          width: 0.2,
          opacity: 0.05,
        },
        data: [],
      },
    ],
  })
  return networkChart
}

function renderPerformance() {
  const performanceChartDom = document.getElementById('performance-container')
  const performanceChart = echarts.init(performanceChartDom)
  performanceChart.setOption({
    title: {
      text: 'TPS',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['Inbound', 'Outbound'],
    },
    xAxis: {
      type: 'time',
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      boundaryGap: [0, '100%'],
      splitLine: {
        show: false,
      },
    },
    series: [
      {
        name: 'Inbound',
        type: 'line',
        showSymbol: false,
        data: [
          // {name: 'init1', value: [new Date().toString(), 0]}
        ],
      },
      {
        name: 'Outbound',
        type: 'line',
        showSymbol: false,
        data: [
          // {name: 'init2', value: [new Date().toString(), 0]}
        ],
      },
    ],
  })
  return performanceChart
}

function renderPerformanceWithAttacker() {
  const performanceWithAttackerChartDom = document.getElementById('performance-with-attacker-container')
  const performanceWithAttackerChart = echarts.init(performanceWithAttackerChartDom)
  performanceWithAttackerChart.setOption({
    title: {
      text: 'TPS',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['All', { name: 'Attacker', textStyle: { color: 'red' } }],
    },
    xAxis: {
      type: 'time',
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      boundaryGap: [0, '100%'],
      splitLine: {
        show: false,
      },
    },
    series: [
      {
        name: 'All',
        type: 'line',
        showSymbol: false,
        data: [
          // {name: 'init1', value: [new Date().toString(), 0]}
        ],
      },
      {
        name: 'Attacker',
        type: 'line',
        showSymbol: false,
        lineStyle: { color: 'red' },
        data: [
          // {name: 'init2', value: [new Date().toString(), 0]}
        ],
      },
    ],
  })
  return performanceWithAttackerChart
}

function renderCpu() {
  const cpuChartDom = document.getElementById('cpu-resource-container')
  const cpuChart = echarts.init(cpuChartDom)
  cpuChart.setOption({
    tooltip: {
      formatter: '{a} <br/>{b} : {c}%',
    },
    series: [
      {
        name: 'CPU Usage',
        type: 'gauge',
        progress: {
          show: true,
        },
        detail: {
          valueAnimation: true,
          formatter: '',
        },
        data: [
          {
            value: 0,
            name: 'CPU(%)',
          },
        ],
      },
    ],
  })
  return cpuChart
}

function renderMemory() {
  const memoryChartDom = document.getElementById('memory-resource-container')
  const memoryChart = echarts.init(memoryChartDom)
  memoryChart.setOption({
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['CPU', 'Memory', 'Bandwidth'],
    },
    xAxis: {
      type: 'time',
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      boundaryGap: [0, '100%'],
      splitLine: {
        show: false,
      },
    },
    series: [
      {
        name: 'CPU',
        type: 'line',
        showSymbol: false,
        data: [
          // {name: 'init1', value: [new Date().toString(), 0]}
        ],
      },
      {
        name: 'Memory',
        type: 'line',
        showSymbol: false,
        data: [
          // {name: 'init1', value: [new Date().toString(), 0]}
        ],
      },
      {
        name: 'Bandwidth',
        type: 'line',
        showSymbol: false,
        data: [
          // {name: 'init2', value: [new Date().toString(), 0]}
        ],
      },
    ],
  })
  return memoryChart
}

async function render() {
  const url = 'https://raw.githubusercontent.com/apache/echarts/29a4fe91f7cf59ea347e066bb241346f0b1bde75/test/data/map/json/world.json'
  const { data: worldGeoJson } = await axios.get(url)
  echarts.registerMap('worldCustom', worldGeoJson)

  renderConfig()
  const networkChart = renderNetwork()
  const performanceChart = renderPerformance()
  const performanceWithAttackerChart = renderPerformanceWithAttacker()
  // const cpuChart = renderCpu();
  const memoryChart = renderMemory()

  controller.initChart({
    networkChart,
    performanceChart,
    performanceWithAttackerChart,
    memoryChart,
  })

  controller.setNodesScale(
    Number.parseInt(document.getElementById('honestScale').value),
    Number.parseInt(document.getElementById('attackerScale').value)
  )
  controller.autoGenerateTx(document.getElementById('tps_input').value)
}

render().then()
