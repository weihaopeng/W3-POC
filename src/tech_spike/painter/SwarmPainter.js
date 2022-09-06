import * as echarts from 'echarts'
const SYMBOL_SVG = 'path://M918.3 262h-62.5v-41.7c0-46-37.3-83.4-83.3-83.4H147.3c-46 0-83.3 37.3-83.3 83.4v354.2c0 46 37.3 83.3 83.3 83.3h250v80.9c-77.4 7.8-133.7 31.5-133.7 59.5 0 34.3 84.7 62.2 189.3 62.2 104.5 0 189.3-27.8 189.3-62.2 0-28.8-59.7-53.1-140.7-60.1v-80.3H689v187.6c0 23 18.7 41.7 41.7 41.7h187.5c23 0 41.7-18.6 41.7-41.7V303.6c0.1-23-18.6-41.6-41.6-41.6z m-229.2 41.6v270.9H189c-23 0-41.7-18.7-41.7-41.7V241.1c0-23 18.7-41.7 41.7-41.7h541.8c23 0 41.7 18.7 41.7 41.7V262h-41.7c-23 0-41.7 18.6-41.7 41.6z m187.6 479.3c0 23-18.7 41.7-41.7 41.7h-20.8c-23 0-41.7-18.7-41.7-41.7v-20.8c0-23 18.7-41.7 41.7-41.7H835c23 0 41.7 18.7 41.7 41.7v20.8z m0-250.1H772.5c-23 0-41.7-18.7-41.7-41.7s18.7-41.7 41.7-41.7h104.2c23 0 41.7 18.7 41.7 41.7-0.1 23.1-18.7 41.7-41.7 41.7z m0-125H772.5c-23 0-41.7-18.7-41.7-41.6 0-23.1 18.7-41.7 41.7-41.7h104.2c23 0 41.7 18.6 41.7 41.7-0.1 22.9-18.7 41.6-41.7 41.6z'

class SwarmPainter {
  constructor(container, nodes) {
    this.container = container
    this.nodes = nodes
    this.links = this.generateLinks(nodes)
    this.chart = echarts.init(container)
    this.highlightedLines = []
  }

  generateLinks(nodes) {
    const links = []
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index]
      nodes.map((n, i) => {
        if (n.id !== node.id) links.push({ source: index, target: i, lineStyle: { curveness: index > i ? 0.1 : -0.1 } })
      })
    }
    return links
  }

  init() {
    const option = {
      series: [
        {
          symbolSize: 30,
          symbol: SYMBOL_SVG,
          name: 'W3 Swarm',
          type: 'graph',
          layout: 'circular',
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [4, 10],
          circular: {
            rotateLabel: false
          },
          data: this.nodes,
          links: this.links,
          label: {
            show: true,
            fontSize: 20,
            position: 'right',
            formatter: '{b}'
          },
          itemStyle: {
            color: '#333'
          },
          lineStyle: {
            color: '#1890ff',
            width: 2,
            opacity: 0
          },
          selectedMode: 'multiple',
          select: {
            itemStyle: {
              color: '#1890ff'
            },
            label: {
              color: 'red'
            },
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

  highlightNodes(nodes) {
    const dataIndex = nodes.map((node) => this.nodes.findIndex((n) => n.id === node.id))
    this.chart.dispatchAction({ type: 'select', dataIndex })
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
    this.cacheHighlightedLines(lines)
    this.chart.dispatchAction({ type: 'select', dataIndex, dataType: 'edge' })
  }

  downplayNodes(nodes) {
    const dataIndex = nodes.map((node) => this.nodes.findIndex((n) => n.id === node.id))
    this.chart.dispatchAction({ type: 'unselect', dataIndex })
  }

  downplayLines(lines) {
    this.unCacheHighlightedLines(lines)
    this.checkIfDownplayNodes(lines.map((line) => ([line.from, line.to])).flat())
    const dataIndex = this.generateLinesToLinkIndex(lines)
    this.chart.dispatchAction({ type: 'unselect', dataIndex, dataType: 'edge' })
  }

  cacheHighlightedLines(lines) {
    for (const line of lines) {
      if (!this.highlightedLines.find((l) => l.from.id === line.from.id && l.to.id === line.to.id)) this.highlightedLines.push(line)
    }
  }

  unCacheHighlightedLines(lines) {
    for (const line of lines) {
      const index = this.highlightedLines.findIndex((l) => l.from.id === line.from.id && l.to.id === line.to.id)
      if (index > -1) this.highlightedLines.splice(index)
    }
  }

  checkIfDownplayNodes(nodes) {
    for (const node of nodes) {
      const inHighlightedLines = this.highlightedLines.find((l) => l.from.id === node.id || l.to.id === node.id)
      if (!inHighlightedLines) this.downplayNodes([node])
    }
  }
}

export default SwarmPainter