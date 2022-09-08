class ChainPainter {
  constructor(container) {
    this.container = container;
  }

  init() {}

  append(data) {
    const element = document.createElement("div");
    element.classList.add('chain-container')
    const nodeInfo = document.createElement("div");
    nodeInfo.innerHTML = `<span>Node</span></br><span>addr: ${data.node.address}</span>`;
    const blockInfo = document.createElement("div");
    blockInfo.innerHTML = `<span>Block</span></br><span>height: ${data.block.height}</span>`;
    element.append(nodeInfo);
    element.append(blockInfo);
    element.title = data.block.hash;
    this.container.append(element);
  }
}

export default ChainPainter;
