import defaultNodeImg from '@/assets/default-node.png'
import highlightNodeImg from '@/assets/highlight-node.png'
import collectorImg from '@/assets/collector.png'
import witnessImg from '@/assets/witness.png'

const TOOLTIP_DISTANCE = 14
class SwarmNode {
  /**
   * A node instance with info, tooltip dom controller based on echarts node and its layout.
   * A node can have multiple tooltips with different shape or background.
   * @param {Object} node 
   * @param {String} node.id
   * @param {String} node.name
   * @param {number} cvsWidth - width of echart canvas width. Use it to calculate tooltip offset.
   * @param {number} cvsHeight 
   */
  constructor(node, cvsWidth, cvsHeight, cvsSimbolSize, tooltipContainer, nodeContainer) {
    this.id = node.id
    this.name = node.name
    this.cvsWidth = cvsWidth
    this.cvsHeight = cvsHeight
    this.cvsSimbolSize = cvsSimbolSize
    this.tooltipGroup = []
    this.tooltipContainer = tooltipContainer
    this.nodeContainer = nodeContainer
    this.isHorizontal = true
    this.initTooltipWrapper()
    this.initNodeWrapper()
  }

  setCoordinates(x, y, xmin, xmax) {
    this.x = x
    this.y = y
    this.calculateTooltipPos(xmin, xmax)
  }

  initTooltipWrapper() {
    this.tooltipWrapper = document.createElement('div')
    this.tooltipWrapper.classList.add('swarm-tooltip-wrapper')
    this.tooltipContainer.append(this.tooltipWrapper)
  }

  initNodeWrapper() {
    this.nodeWrapper = document.createElement('div')
    this.nodeWrapper.classList.add('swarm-node-wrapper')
    this.nodeContainer.append(this.nodeWrapper)
    this.initNodeSymbol()
    this.initNodeName()
  }

  calculateTooltipPos(xmin, xmax) {
    const xmid = this.cvsWidth / 2
    this.isHorizontal = false
    if (this.x <= xmid) {
      this.tooltipWrapper.style.transform = `translateX(calc(-100% - ${TOOLTIP_DISTANCE}px)`
    } else {
      this.tooltipWrapper.style.transform = `translateX(${this.cvsSimbolSize + TOOLTIP_DISTANCE}px)`
    }
    this.nodeWrapper.style.left = this.tooltipWrapper.style.left = `${this.x - this.cvsSimbolSize / 2}px`
    this.nodeWrapper.style.top = this.tooltipWrapper.style.top = `${this.y - this.cvsSimbolSize / 2}px`

    this.tooltipWrapper.classList.add(this.isHorizontal ? 'horizontal' : 'vertical')
  }

  initNodeSymbol() {
    this.symbolImg = document.createElement('img')
    this.symbolImg.onload = () => {
      this.nodeWrapper.append(this.symbolImg)
    }
    this.symbolImg.src = defaultNodeImg
  }

  initNodeName() {
    const contentWrapper = document.createElement('div')
    contentWrapper.classList.add('swarm-node-wrapper__content')
    this.nameElement = document.createElement('div')
    this.nameElement.innerText = this.name
    this.roleElement = document.createElement('div')
    contentWrapper.append(this.nameElement)
    contentWrapper.append(this.roleElement)
    this.nodeWrapper.append(contentWrapper)
  }

  setSymbol(type) {
    if (type === 'default-node') this.symbolImg.src = defaultNodeImg
    if (type === 'highlight-node') this.symbolImg.src = highlightNodeImg
    if (type === 'collector') this.symbolImg.src = collectorImg
    if (type === 'witness') this.symbolImg.src = witnessImg
  }

  setRole(type) {
    if (type !== 'highlightNode') this.roleElement.innerText = type
  }

  updateCvsSize(width, height) {
    this.cvsWidth = width
    this.cvsHeight = height
  }

  // TODO: this is a temporary duty for first node instance.
  drawTheCircle() {
    console.log(this.nodeContainer)
    const oldCircle = this.nodeContainer.getElementsByClassName('swarm-node-circle')[0]
    if (oldCircle) oldCircle.remove()
    const xmid = this.cvsWidth / 2
    const ymid = this.cvsHeight / 2
    const circleRadius = Math.sqrt(Math.pow(xmid - this.x, 2) + Math.pow(ymid - this.y, 2))
    const circle = document.createElement('div')
    circle.classList.add('swarm-node-circle')
    circle.style.height = circle.style.width = `${2 * circleRadius}px`
    circle.style.border = 'solid 1px rgba(255, 255, 255, 0.1)'
    circle.style.borderRadius = '50%'
    circle.style.position = 'absolute'
    circle.style.left = '50%'
    circle.style.top = '50%'
    circle.style.transform = `translate(calc(-50% + ${this.cvsSimbolSize / 2}px), calc(-50% + ${this.cvsSimbolSize / 2}px))`
    this.nodeContainer.prepend(circle)
  }

  // calculateTooltipPos(xmin, xmax) {
  //   const ymid = this.cvsHeight / 2
  //   if (this.x === xmin) {
  //     this.tooltipWrapper.style.transform = `translateX(calc(-100% - ${TOOLTIP_DISTANCE}px)`
  //     this.isHorizontal = false
  //   } else if (this.x === xmax) {
  //     this.tooltipWrapper.style.transform = `translateX(${this.cvsSimbolSize + TOOLTIP_DISTANCE}px)`
  //     this.isHorizontal = false
  //   }
  //   else if (this.y < ymid) this.tooltipWrapper.style.transform = `translateY(calc(-100% - ${TOOLTIP_DISTANCE}px)`
  //   else this.tooltipWrapper.style.transform = `translateY(${this.cvsSimbolSize + TOOLTIP_DISTANCE}px)`

  //   this.tooltipWrapper.style.left = `${this.x - this.cvsSimbolSize / 2}px`
  //   this.tooltipWrapper.style.top = `${this.y - this.cvsSimbolSize / 2}px`

  //   this.tooltipWrapper.classList.add(this.isHorizontal ? 'horizontal' : 'vertical')
  // }

  /**
   * Tooltip card is a card with two tooltips. A node may receive messages from two tx/block processes at the same time.
   * One process corresponds to one card. In one card, there are two tooltips to present receive xx msg and calculate to generate xx msg.
   * When append a tooltip, if there is no tooltip card with corresponding id, append a tooltip card firstly.
   */
  _appendTooltipCard(id) {
    const tooltipCard = document.createElement('div')
    tooltipCard.classList.add('swarm-tooltip-card')
    tooltipCard.id = id
    this.tooltipGroup.push(tooltipCard)
    this.tooltipWrapper.append(tooltipCard)
    return tooltipCard
  }

  /**
   * A tooltip card will remove when there are no tooltips inside.
   */
  _removeTooltipCard(tooltipCard) {
    const index = this.tooltipGroup.findIndex((item) => item.id === tooltipCard.id)
    if (index > -1) this.tooltipGroup.splice(index, 1)
    tooltipCard.remove()
  }

  appendTooltip(msg) {
    const id = this.id // TODO, 应该是data里面的用于区分一次session的id。这里先不考虑多session，所以直接用node的id。
    const tooltipCard = this.tooltipGroup.find((tooltipCard) => tooltipCard.id === id) || this._appendTooltipCard(id)
    const children = Array.from(tooltipCard.children)
    if (children.find((child) => (child.getAttribute('w3-content') === msg.data.content) && child.classList.contains(msg.action))) {
      // 已有重复的tooltip了。这是为了避免发出消息的节点，重复显示。目前用title判断，后续用其他标识。
      return
    }
    const tooltip = document.createElement('div')
    tooltip.classList.add('swarm-tooltip')
    // TODO 根据data内容，调整tooltip内容
    // tooltip.innerText = msg.data.content
    tooltip.innerHTML = `<div>${msg.data.content}</div>`
    if (msg.data.info) tooltip.innerHTML += `<div><span>From: </span><span class="info-in-tooltip">${msg.data.info.from}</span></div><div><span>To: </span><span class="info-in-tooltip">${msg.data.info.to}</span></div>`
    tooltip.setAttribute('w3-content', msg.data.content)
    tooltip.setAttribute('w3-type', msg.type)
    tooltip.classList.add(msg.action)
    tooltip.classList.add(msg.type)
    if (msg.valid !== undefined) tooltip.classList.add(msg.valid ? 'valid' : 'invalid')
    tooltipCard.append(tooltip)
  }

  removeTooltip(msg) {
    const id = this.id // TODO
    const tooltipCard = this.tooltipGroup.find((tooltipCard) => tooltipCard.id === id)
    if (!tooltipCard) return // 实际不应该存在
    const children = Array.from(tooltipCard.children)
    const child = children.find((child) => child.getAttribute('w3-content') === msg.data.content)
    if (!child) return
    child.classList.add('to-remove')
    setTimeout(() => {
      child.remove()
    }, 300)
    if (tooltipCard.children.length === 0) this._removeTooltipCard(tooltipCard)
  }

  changeTooltipToValid(msg) {
    const id = this.id
    const tooltipCard = this.tooltipGroup.find((tooltipCard) => tooltipCard.id === id)
    const tooltip = Array.from(tooltipCard.children).find((child) => child.getAttribute('w3-content') === msg.data.content)
    if (tooltip) tooltip.classList.add('valid')
  }
}

export default SwarmNode
