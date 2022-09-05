class BpPainter {
  constructor(container) {
    this.container = container
  }

  init() {

  }

  append(data) {
    const round = data.data.round
    const { from, to } = data
    const roundDom = document.createElement('div')
    roundDom.classList.add('bp-round-title')
    roundDom.innerText = `Witness-round${round}`

    const fromType = round === 1 ? '收集者' : `见证者${round - 1}`
    const fromDom = document.createElement('div')
    fromDom.classList.add('bp-from')
    fromDom.innerHTML = `<span class="bp-type">${fromType}</span><span>${from.name}</span>`

    const toType = `见证者${round}`
    const toDom = document.createElement('div')
    toDom.classList.add('bp-to')
    toDom.innerHTML = `<span class="bp-type">${toType}</span><span>${to.name}</span>`
    
    const dom = document.createElement('div')
    dom.classList.add('bp-container')
    dom.append(roundDom)
    dom.append(fromDom)
    dom.append(toDom)
    this.container.append(dom)
    dom.scrollIntoView()
  }
}

export default BpPainter
