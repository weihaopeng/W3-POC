import { getRandomIp, getRandomHash, sleep } from '../util.js';

const msgTypes = ["tx", "bp", "block", "fork"];
const chainEvents = ["block on chain", "chain fork"];

const COMMUNICATE_COST = 2000
const COMMUNICATE_COST_THRESHOLD = 500 // 通信在2000~2200ms波动

const CALCULATE_COST = 500
const CALCULATE_COST_THRESHOLD = 500 // 验证用时在500~1000ms波动
class MessageSimulator {
  constructor({ messageHandler, nodes }) {
    this.messageHandler = messageHandler;
    this.nodes = nodes;
    this.initMsgObj();
    this.init();
  }

  init() {
    this.currentHeight = Math.ceil(Math.random() * 100);
    this.initNetworkControl();
    this.initChainControl();
    this.initAutoControl();
    this.bindDragEvent();
  }

  initMsgObj() {
    this.networkObj = { type: "tx", from: "111", to: [] };
    this.chainObj = { event: "block on chain" };
  }

  initNetworkControl() {
    const container = document.createElement("div");
    container.classList.add("w3-form");
    this.initTitle(container, "Network");
    this.initTypeControl(container);
    this.initFromControl(container);
    this.initToControl(container);
    this.initSendBtn(container, "network");
    document.getElementById("control-simulator").append(container);
  }

  initChainControl() {
    const container = document.createElement("div");
    container.classList.add("w3-form");
    this.initTitle(container, "Chain");
    this.initEventControl(container);
    this.initSendBtn(container, "chain");
    document.getElementById("control-simulator").append(container);
  }

  initTitle(container, title) {
    const titleDom = document.createElement("div");
    titleDom.classList.add("w3-form__title");
    titleDom.innerText = title;
    container.append(titleDom);
  }

  initTypeControl(container) {
    const typeControl = this.createFormItem(container, "Type");
    const handler = (val) => (this.networkObj.type = val);
    const typeBtnGroup = this.createBtnGroup(msgTypes, "tx", handler);
    typeBtnGroup.classList.add("w3-form-item__control");
    typeControl.append(typeBtnGroup);
    container.append(typeControl);
  }

  initFromControl(container) {
    const fromControl = this.createFormItem(container, "From");
    const nodeNames = this.nodes.map((node) => node.name);
    const handler = (val) => {
      this.networkObj.from = this.nodes.find((node) => node.name === val).id;
      const checkboxGroup = Array.from(document.getElementsByClassName('w3-checkbox-group'));
      checkboxGroup.map((dom) => {
        if (dom.innerText.startsWith(val)) dom.classList.add('w3-checkbox-group--hidden');
        else dom.classList.remove('w3-checkbox-group--hidden');
      })
    };
    const fromBtnGroup = this.createBtnGroup(nodeNames, "No.1", handler);
    fromBtnGroup.classList.add("w3-form-item__control");
    fromControl.append(fromBtnGroup);
    container.append(fromControl);
  }

  initToControl(container) {
    const toControl = this.createFormItem(container, "To");
    const checkboxGroup = this.createToCheckboxMatrix();
    toControl.append(checkboxGroup);
    container.append(toControl);
  }

  initSendBtn(container, type) {
    const btnFormItem = this.createFormItem(container, "");
    const handler = () => this.onSendMsg(type);
    const btn = this.createBtn("Send", handler, true);
    btn.classList.add("w3-form-item__control");
    btnFormItem.append(btn);
    container.append(btnFormItem);
  }

  initEventControl(container) {
    const eventControl = this.createFormItem(container, "Event");
    const handler = (val) => (this.chainObj.event = val);
    const fromBtnGroup = this.createBtnGroup(
      chainEvents,
      chainEvents[0],
      handler
    );
    fromBtnGroup.classList.add("w3-form-item__control");
    eventControl.append(fromBtnGroup);
    container.append(eventControl);
  }

  createFormItem(container, label) {
    const formItem = document.createElement("div");
    formItem.classList.add("w3-form-item");
    const labelDom = document.createElement("div");
    labelDom.classList.add("w3-form-item__label");
    labelDom.innerText = label;
    formItem.append(labelDom);
    container.append(formItem);
    return formItem;
  }

  createBtnGroup(keys, defaultKey, onValChange) {
    const btnGroup = document.createElement("div");
    btnGroup.classList.add("w3-btn-group");
    for (const key of keys) {
      const handler = () => {
        this.onChangeKey(btn, btnGroup);
        onValChange && onValChange(key);
      };
      const btn = this.createBtn(key, handler);
      if (key === defaultKey) btn.classList.add("w3-btn--selected");
      btnGroup.append(btn);
    }
    return btnGroup;
  }

  createBtn(text, onClick, isPrimary = false) {
    const btn = document.createElement("div");
    btn.classList.add("w3-btn");
    btn.innerText = text;
    if (isPrimary) btn.classList.add("w3-btn--primary");
    btn.addEventListener("click", onClick);
    return btn;
  }

  createToCheckboxMatrix() {
    this.checkboxMap = {} // To facilitate the change of state 
    const group = document.createElement("div");
    const onCheckall = (checked) => this.onCheckAllTo(checked);
    this.checkboxMap.checkAll = this.createCheckbox("Check all", onCheckall, true);
    this.checkboxMap.checkAll.classList.add('w3-checkbox--checkall')
    group.classList.add("w3-form-item__control");
    group.append(this.checkboxMap.checkAll);
    for (const node of this.nodes) {
      const dom = document.createElement('div');
      dom.classList.add('w3-checkbox-group');
      if (node.name === 'No.1') dom.classList.add('w3-checkbox-group--hidden');
      for (const key of [node.name, 'valid', 'overtime']) {
        const onCheck = (checked) => this.onCheckItem(checked, node.name, key);
        const checkboxItem = this.createCheckbox(key, onCheck, key !== 'overtime');
        this.checkboxMap[`${node.name}.${key}`] = checkboxItem
        dom.append(checkboxItem)
      }
      group.append(dom);
    }
    return group;
  }

  createCheckbox(text, handler, defaultCheck = false, disabled = false) {
    const checkbox = document.createElement("label");
    checkbox.classList.add("w3-checkbox");
    const input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    if (disabled) input.setAttribute("disabled", "");
    if (defaultCheck) input.checked = true;
    const checkmark = document.createElement("span");
    checkmark.classList.add("w3-checkbox__checkmark");
    checkbox.innerText = text;
    checkbox.addEventListener("click", (event) => {
      if (event.target !== input) return;
      const checked = input.checked;
      handler && handler(checked);
    });
    checkbox.append(input);
    checkbox.append(checkmark);
    return checkbox;
  }

  onCheckAllTo(checked) {
    if (checked) {
      for (const node of this.nodes) {
        if (this.ifChecked(`${node.name}.${node.name}`)) continue
        for (const key of [node.name, 'valid']) {
          this.setChecked(`${node.name}.${key}`, true)
        }
      }
    } else {
      Object.values(this.checkboxMap).map((checkbox) => checkbox.firstElementChild.checked = false)
    }
  }

  ifChecked(key) {
    return this.checkboxMap[key].firstElementChild.checked
  }

  setChecked(key, val) {
    this.checkboxMap[key].firstElementChild.checked = val
  }

  onCheckItem(checked, item, key) {
    if (key.startsWith('No') && checked) {
      this.setChecked(`${item}.valid`, true)
    }
  }

  onChangeKey(btn, btnGroup) {
    const val = btn.innerText;
    const btnDomArray = Array.from(btnGroup.childNodes);
    const selected = btnDomArray.find((dom) =>
      dom.classList.contains("w3-btn--selected")
    );
    const currentVal = selected?.innerText || "";
    if (currentVal === val) return;
    for (const btnDom of btnDomArray) {
      btnDom.classList.remove("w3-btn--selected");
    }
    btn.classList.add("w3-btn--selected");
  }

  onSendMsg(type) {
    if (type === 'network') this.sendNetworkSeriesMsg();
    else {
      this.sendChainMessage();
    }
  }

  sendNetworkSeriesMsg() {
    const toList = this.parseToList()
    let block;
    if (this.networkObj.type === 'block') block = this.mockBlockInfo();
    const sessionId = getRandomHash();
    this.sendDepartureMsg(sessionId, toList, block);
    this.sendArriveMsg(sessionId, toList, block);
    this.sendVerifyMsg(sessionId, toList);
  }

  mockBlockInfo() {
    const address = getRandomIp()
    return {
      node: { address, i: Math.floor(Math.random() * 1000) },
      block: { height: this.currentHeight++, hash: getRandomHash(), i: Math.floor(Math.random() * 1000) }
    }
  }

  parseToList() {
    const list = []
    for (const node of this.nodes) {
      if (node.id === this.networkObj.from) continue
      if (this.ifChecked(`${node.name}.${node.name}`)) {
        list.push({
          node,
          valid: this.ifChecked(`${node.name}.valid`),
          overtime: this.ifChecked(`${node.name}.overtime`)
        })
      }
    }
    return list
  }

  sendDepartureMsg(sessionId, toList, block) {
    for (const to of toList) {
      const msg = this.createNetworkMsg(sessionId, to.node.name, block);
      console.log(msg)
      this.messageHandler.handleNetworkMessage(msg, 'departure');
    }
  }

  sendArriveMsg(sessionId, toList, block) {
    let max = 0;
    for (const to of toList) {
      if (to.overtime) continue
      to.arriveTime = Math.random() * COMMUNICATE_COST_THRESHOLD + COMMUNICATE_COST
      max = Math.max(max, to.arriveTime);
      setTimeout(() => {
        const msg = this.createNetworkMsg(sessionId, to.node.name, block, false);
        this.messageHandler.handleNetworkMessage(msg, 'arrive');
      }, to.arriveTime)
    }
    return max;
  }

  // valid true need to present?
  sendVerifyMsg(sessionId, toList) {
    let max = 0;
    for (const to of toList) {
      if (to.overtime) continue
      to.arriveAndCalcTime = to.arriveTime + Math.random() * CALCULATE_COST_THRESHOLD + CALCULATE_COST
      max = Math.max(max, to.arriveAndCalcTime);
      setTimeout(() => {
        const msg = this.createNodeVerifyMsg(sessionId, to.node.name, to.valid);
        this.messageHandler.handleNodeVerify(msg);
      }, to.arriveAndCalcTime);
    }
    return max;
  }

  createNetworkMsg(sessionId, to, block, isDeparture = true) {
    const msg = {
      sessionId,
      type: this.networkObj.type,
      data: {},
      from: { address: this.networkObj.from, i: Math.floor(Math.random() * 1000) },
      to: { address: this.nodes.find((node) => node.name === to).id, i: Math.floor(Math.random() * 1000) }
    }
    if (this.networkObj.type === 'bp') msg.data.round = this.networkObj.bpround || 1;
    if (this.networkObj.type === 'block') {
      msg.data = block;
    }
    if (isDeparture) msg.departureTime = new Date()
    else msg.arrivalTime = new Date()
    return msg
  }

  createNodeVerifyMsg(sessionId, to, valid) {
    return {
      sessionId,
      type: this.networkObj.type,
      data: {},
      valid,
      node: { address: this.nodes.find((node) => node.name === to).id, i: Math.floor(Math.random() * 1000) }
    }
  }

  sendChainMessage(block) {
    if (this.chainObj.event === 'block on chain') {
      this.messageHandler.handleBlockOnChain({ data: block || this.mockBlockInfo() });
    } else {
      // TODO fork
      this.messageHandler.handleChainForked({ data: {} });
      alert('Todo');
    }
  }

  bindDragEvent() {
    const simulator = document.getElementById("control-simulator");
    const dragBar = simulator.getElementsByClassName("control-simulator__dragging-bar")[0];
    let onDragging = false;
    let x = 0,
      y = 0;
    const initLeft = simulator.offsetLeft;
    const initTop = simulator.offsetTop;
    dragBar.addEventListener("mousedown", (event) => {
      onDragging = true;
      x = event.clientX;
      y = event.clientY;
    });
    document.body.addEventListener("mousemove", (event) => {
      if (onDragging) {
        simulator.style.left = `${(parseInt(simulator.style.left) || initLeft) + event.clientX - x}px`;
        simulator.style.top = `${(parseInt(simulator.style.top) || initTop) + event.clientY - y}px`;
        simulator.style.bottom = 'unset';
        x = event.clientX;
        y = event.clientY;
      }
    });
    document.body.addEventListener("mouseup", (event) => {
      onDragging = false;
    });
  }

  initAutoControl() {
    // TODO auto send msg engine.
    const container = document.createElement("div");
    container.classList.add("w3-form");
    this.initTitle(container, "Autoplay");
    this.initAutoplayControl(container);
    document.getElementById("control-simulator").append(container);
  }

  initAutoplayControl(container) {
    const btnFormItem = this.createFormItem(container, "");
    const handler = () => this.autoplay(btnFormItem);
    const wrapper = document.createElement('div');
    const description = document.createElement('div');
    description.innerText = 'tx msg 3 rounds, bp msg 2rounds, a block msg, then block on chain.'
    description.style.width = '260px';
    const btn = this.createBtn("▶️", handler);
    wrapper.classList.add("w3-form-item__control");

    wrapper.append(description);
    wrapper.append(btn);
    btnFormItem.append(wrapper);
    container.append(btnFormItem);
  }

  autoplay(btnParent) {
    const btn = btnParent.getElementsByClassName('w3-form-item__control')[0];
    if (!this.isPlaying) {
      this.isPlaying = true;
      btn.innerText = '⏹';
      this.play(btn);
    } else {
      this.isPlaying = false;
      btn.innerText = '▶️';
    }
  }

  async play(btn) {
    const txround = 3;
    const bpround = 2;
    const type = this.networkObj.type;
    const from = this.networkObj.from;
    this.networkObj.type = 'tx';
    for (let i = 0; i < txround; i++) {
      if (!this.isPlaying) break;
      const sessionId = getRandomHash();
      const index = Math.floor(Math.random() * this.nodes.length);
      this.networkObj.from = this.nodes[index].id;
      const toList = this.nodes.filter((node) => (node.id !== this.networkObj.from)).map((node) => ({ node, valid: true, overtime: false }));
      this.sendDepartureMsg(sessionId, toList);
      this.sendArriveMsg(sessionId, toList);
      const maxCost = this.sendVerifyMsg(sessionId, toList);
      await sleep(maxCost + 2000);
    }

    this.networkObj.type = 'bp';
    for (let i = 0; i < bpround; i++) {
      if (!this.isPlaying) break;
      this.networkObj.bpround = i + 1;
      const sessionId = getRandomHash();
      const index = Math.floor(Math.random() * this.nodes.length);
      this.networkObj.from = this.nodes[index].id;
      const toList = this.nodes.filter((node) => (node.id !== this.networkObj.from)).map((node) => ({ node, valid: true, overtime: false }));
      this.sendDepartureMsg(sessionId, toList);
      this.sendArriveMsg(sessionId, toList);
      const maxCost = this.sendVerifyMsg(sessionId, toList);
      await sleep(maxCost + 2000);
    }

    let block;
    this.networkObj.type = 'block';
    if (this.isPlaying) {
      const sessionId = getRandomHash();
      const index = Math.floor(Math.random() * this.nodes.length);
      this.networkObj.from = this.nodes[index].id;
      const toList = this.nodes.filter((node) => (node.id !== this.networkObj.from)).map((node) => ({ node, valid: true, overtime: false }));
      block = this.mockBlockInfo();
      this.sendDepartureMsg(sessionId, toList, block);
      this.sendArriveMsg(sessionId, toList, block);
      const blockCost = this.sendVerifyMsg(sessionId, toList);
      await sleep(blockCost + 2000);
    }

    if (this.isPlaying) {
      const chainType = this.chainObj.event
      this.chainObj.event = 'block on chain'
      this.sendChainMessage(block)
      this.chainObj.event = chainType
    }

    this.isPlaying = false;
    btn.innerText = '▶️';
    this.networkObj.type = type;
    this.networkObj.from = from;
  }
}

export default MessageSimulator;
