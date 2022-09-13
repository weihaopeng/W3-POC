import * as echarts from 'echarts'
import SwarmNode from './SwarmNode'
const SYMBOL_SIZE = 44

class SwarmPainter {
  constructor(cvsContainer, tooltipContainer, nodeContainer, nodes) {
    const { offsetWidth, offsetHeight } = cvsContainer
    this.nodes = nodes.map((node) => new SwarmNode(node, offsetWidth, offsetHeight, SYMBOL_SIZE, tooltipContainer, nodeContainer))
    this.links = this.generateLinks(nodes)
    this.chart = echarts.init(cvsContainer)
    this.tooltipContainer = tooltipContainer
  }

  generateLinks(nodes) {
    const links = []
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index]
      nodes.map((n, i) => {
        const curveness = index > i ? 0.1 : -0.1

        if (n.id !== node.id) links.push({ source: index, target: i, lineStyle: { curveness } })
      })
    }
    return links
  }

  init(needClear) {
    this.initChart()
    this.setNodesCoordinates()
    window.addEventListener('resize', () => {
      this.chart.resize()
      this.setNodesCoordinates()
    })
    if (needClear) this.initClearBtn()
  }

  initChart() {
    const option = {
      series: [
        {
          symbolSize: SYMBOL_SIZE,
          symbol: 'circle',
          name: 'W3 Swarm',
          type: 'graph',
          layout: 'circular',
          animation: false,
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [4, 10],
          circular: {
            rotateLabel: false
          },
          data: this.nodes,
          links: this.links,
          itemStyle: {
            color: 'transparent'
          },
          lineStyle: {
            color: '#1890ff',
            width: 2,
            opacity: 0
          },
          selectedMode: 'multiple',
          select: {
            lineStyle: {
              color: '#1890ff',
              opacity: 1
            }
          }
        }
      ]
    }
    this.chart.setOption(option)
  }

  initClearBtn() {
    const btn = document.createElement('div')
    btn.classList.add('w3-btn')
    btn.classList.add('w3-btn--primary')
    btn.addEventListener('click', () => {
      this.clearAll()
    })
    btn.innerText = 'Clear all'
    this.tooltipContainer.prepend(btn)
  }

  clearAll() {
    for (const tooltipWrapper of Array.from(document.getElementsByClassName('swarm-tooltip-wrapper'))) {
      tooltipWrapper.innerHTML = ''
    }
    this.nodes.map((node) => node.tooltipGroup = [])
    this.chart.dispatchAction({ type: 'unselect', dataIndex: this.links.map((link, index) => index), dataType: 'edge' })
    this.chart.dispatchAction({ type: 'unselect', dataIndex: this.nodes.map((node, index) => index) })
  }

  setSelectedLineColor(color) {
    this.chart.setOption({
      series: [
        {
          select: {
            lineStyle: {
              color
            }
          }
        }
      ]
    })
  }

  setNodesCoordinates() {
    let xmin = Infinity, xmax = 0
    const nodeLayouts = this.chart._chartsViews[0]._symbolDraw._data._itemLayouts
    console.log(nodeLayouts)
    nodeLayouts.map((coordinate) => {
      coordinate[0] = Math.floor(coordinate[0])
      coordinate[1] = Math.floor(coordinate[1])
      xmin = Math.min(coordinate[0], xmin)
      xmax = Math.max(coordinate[0], xmax)
    })
    for(let i = 0; i < this.nodes.length; i++) {
      const [x, y] = nodeLayouts[i]
      this.nodes[i].setCoordinates(x, y, xmin, xmax)
      if (i === 0) this.nodes[i].drawTheCircle()
    }
  }

  highlightNodes(nodes, msg) {
    const dataIndex = nodes.map((node) => this.nodes.findIndex((n) => n.id === node.id))
    dataIndex.map((i) => {
      if (msg.valid || msg.valid === false) this.nodes[i].changeTooltipToValid(msg)
      else this.nodes[i].appendTooltip(msg)
    })
  }

  setNodeRoleName(id, roleName) {
    const target = this.nodes.find(node => node.id === id)
    target.setRole(roleName)
  }

  setNodeSymbol(id, symbol, symbolSize, symbolColor) {
    const target = this.nodes.find(node => node.id === id)
    target.setSymbol(symbol)
  }

  generateLinesToLinkIndex(lines) {
    return lines.map((line) => {
      const source = this.nodes.findIndex((n) => n.id === line.from.id)
      const target = this.nodes.findIndex((n) => n.id === line.to.id)
      return this.links.findIndex((link) => source === link.source && target === link.target)
    })
  }

  highlightLines(lines) {
    const dataIndex = this.generateLinesToLinkIndex(lines)
    // this.cacheHighlightedLines(lines)
    this.chart.dispatchAction({ type: 'select', dataIndex, dataType: 'edge' })
  }

  downplayNodes(nodes, msg) {
    const dataIndex = nodes.map((node) => this.nodes.findIndex((n) => n.id === node.id))
    this.chart.dispatchAction({ type: 'unselect', dataIndex })
    dataIndex.map((i) => this.nodes[i].removeTooltip(msg))
  }

  downplayLines(lines, msg) {
    // this.unCacheHighlightedLines(lines)
    // this.checkIfDownplayNodes(lines.map((line) => ([line.from, line.to])).flat(), msg)
    const dataIndex = this.generateLinesToLinkIndex(lines)
    this.chart.dispatchAction({ type: 'unselect', dataIndex, dataType: 'edge' })
  }

  // cacheHighlightedLines(lines) {
  //   for (const line of lines) {
  //     if (!this.highlightedLines.find((l) => l.from.id === line.from.id && l.to.id === line.to.id)) this.highlightedLines.push(line)
  //   }
  // }

  // unCacheHighlightedLines(lines) {
  //   for (const line of lines) {
  //     const index = this.highlightedLines.findIndex((l) => l.from.id === line.from.id && l.to.id === line.to.id)
  //     if (index > -1) this.highlightedLines.splice(index, 1)
  //   }
  // }

  // checkIfDownplayNodes(nodes, data) {
  //   for (const node of nodes) {
  //     const inHighlightedLines = this.highlightedLines.find((l) => l.from.id === node.id || l.to.id === node.id)
  //     if (!inHighlightedLines) this.downplayNodes([node], data)
  //   }
  // }
}

export default SwarmPainter
