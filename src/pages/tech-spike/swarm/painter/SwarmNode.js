const TOOLTIP_DISTANCE = 25
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
  constructor(node, cvsWidth, cvsHeight, cvsSimbolSize, tooltipContainer) {
    this.id = node.id
    this.name = node.name
    this.cvsWidth = cvsWidth
    this.cvsHeight = cvsHeight
    this.cvsSimbolSize = cvsSimbolSize
    this.tooltipGroup = []
    this.tooltipContainer = tooltipContainer
    this.isHorizontal = true
    this.initTooltipWrapper()
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

  calculateTooltipPos(xmin, xmax) {
    const ymid = this.cvsHeight / 2
    if (this.x === xmin) {
      this.tooltipWrapper.style.transform = `translateX(calc(-100% - ${TOOLTIP_DISTANCE}px)`
      this.isHorizontal = false
    } else if (this.x === xmax) {
      this.tooltipWrapper.style.transform = `translateX(${this.cvsSimbolSize + TOOLTIP_DISTANCE}px)`
      this.isHorizontal = false
    }
    else if (this.y < ymid) this.tooltipWrapper.style.transform = `translateY(calc(-100% - ${TOOLTIP_DISTANCE}px)`
    else this.tooltipWrapper.style.transform = `translateY(${this.cvsSimbolSize + TOOLTIP_DISTANCE}px)`

    this.tooltipWrapper.style.left = `${this.x - this.cvsSimbolSize / 2}px`
    this.tooltipWrapper.style.top = `${this.y - this.cvsSimbolSize / 2}px`

    this.tooltipWrapper.classList.add(this.isHorizontal ? 'horizontal' : 'vertical')
  }

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
    const tooltip = Array.from(tooltipCard.children).find((child) => child.innerText === msg.data.content)
    tooltip.classList.add('valid')
  }
}

export default SwarmNode
