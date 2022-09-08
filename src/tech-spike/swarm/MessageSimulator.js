const msgTypes = ["tx", "bp", "block", "fork"];
const chainEvents = ["block on chain", "chain fork"];

const COMMUNICATE_COST = 2000
const COMMUNICATE_COST_THRESHOLD = 500 // 通信在2000~2200ms波动

const CALCULATE_COST = 500
const CALCULATE_COST_THRESHOLD = 500 // 验证用时在500~1000ms波动
class MessageSimulator {
  constructor({ messageHandler, messageMaker, nodes }) {
    this.messageHandler = messageHandler;
    this.messageMaker = messageMaker;
    this.nodes = nodes;
    this.initMsgObj();
    this.init();
  }

  init() {
    this.initNetworkControl();
    this.initChainControl();
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
    const handler = (val) => (this.networkObj.from = val);
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
    this.sendDepartureMsg(toList);
    this.sendArriveMsg(toList);
    this.sendVerifyMsg(toList);
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

  sendDepartureMsg(toList) {
    for (const to of toList) {
      const msg = this.createNetworkMsg(to.node.name);
      console.log(msg)
      this.messageHandler.handleNetworkMessage(msg, 'departure');
    }
  }

  sendArriveMsg(toList) {
    for (const to of toList) {
      if (to.overtime) continue
      to.arriveTime = Math.random() * COMMUNICATE_COST_THRESHOLD + COMMUNICATE_COST
      setTimeout(() => {
        const msg = this.createNetworkMsg(to.node.name, false);
        this.messageHandler.handleNetworkMessage(msg, 'arrive');
      }, to.arriveTime)
    }
  }

  // valid true need to present?
  sendVerifyMsg(toList) {
    for (const to of toList) {
      if (to.overtime) continue
      setTimeout(() => {
        const msg = this.createNodeVerifyMsg(to.node.name, to.valid);
        console.log(msg)
        this.messageHandler.handleNodeVerify(msg);
      }, to.arriveTime + Math.random() * CALCULATE_COST_THRESHOLD + CALCULATE_COST)
    }
  }

  createNetworkMsg(to, isDeparture = true) {
    const msg = {
      type: this.networkObj.type,
      data: {},
      from: { address: this.networkObj.from, i: Math.floor(Math.random() * 1000) },
      to: { address: this.nodes.find((node) => node.name === to).id, i: Math.floor(Math.random() * 1000) }
    }
    if (this.networkObj.type === 'bp') msg.data.round = 1;
    if (this.networkObj.type === 'block') {
      msg.data = {
        block: { height: 23, hash: '0x12345678901234567', i: 10 },
        node: { address: '192.168.1.1', i: 10}
      };
    }
    if (isDeparture) msg.departureTime = new Date()
    else msg.arrivalTime = new Date()
    return msg
  }

  createNodeVerifyMsg(to, valid) {
    return {
      type: this.networkObj.type,
      data: {},
      valid,
      node: { address: this.nodes.find((node) => node.name === to).id, i: Math.floor(Math.random() * 1000) }
    }
  }

  sendChainMessage() {
    const data = { node: { address: '192.168.1.1', i: 10} };
    if (this.chainObj.event === 'block on chain') {
      data.block = { height: 23, hash: '0x12345678901234567', i: 10 };
      this.messageHandler.handleBlockOnChain({ data });
    } else {
      data.fork = { data: 'TODO' };
      this.messageHandler.handleChainForked({ data });
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
}

export default MessageSimulator;
