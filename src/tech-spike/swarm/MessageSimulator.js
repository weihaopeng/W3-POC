const msgTypes = ["tx", "bp", "block", "fork"];
const chainEvents = ["block on chain", "chain fork"];
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
    this.checkList = {} // To facilitate the change of state 
    const group = document.createElement("div");
    const onCheckall = (checked) => this.onCheckAllTo(checked);
    this.checkList.checkAll = this.createCheckbox("Check all", onCheckall);
    this.checkList.checkAll.classList.add('w3-checkbox--checkall')
    group.classList.add("w3-form-item__control");
    group.append(this.checkList.checkAll);
    for (const node of this.nodes) {
      const dom = document.createElement('div');
      dom.classList.add('w3-checkbox-group')
      for (const key of [node.name, 'valid', 'overtime']) {
        const onCheck = (checked) => this.onCheckItem(checked, node.name, key);
        const checkboxItem = this.createCheckbox(key, onCheck);
        this.checkList[`${node.name}.${key}`] = checkboxItem
        dom.append(checkboxItem)
      }
      group.append(dom);
    }
    return group;
  }

  createCheckbox(text, handler, disabled = false) {
    const checkbox = document.createElement("label");
    checkbox.classList.add("w3-checkbox");
    const input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    if (disabled) input.setAttribute("disabled", "");
    const checkmark = document.createElement("span");
    checkmark.classList.add("w3-checkbox__checkmark");
    checkbox.innerText = text;
    checkbox.addEventListener("click", () => {
      const checked = input.checked;
      handler && handler(checked);
    });
    checkbox.append(input);
    checkbox.append(checkmark);
    return checkbox;
  }

  onCheckAllTo(checked) {
    if (checked) {
    }
  }

  onCheckItem(checked, item, key) {

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
    console.log(type, this.networkObj, this.chainObj);
  }

  bindDragEvent() {
    const simulator = document.getElementById("control-simulator");
    const dragBar = simulator.getElementsByClassName(
      "control-simulator__dragging-bar"
    )[0];
    let onDragging = false;
    let x = 0,
      y = 0;
    const initLeft = 100;
    const initTop = 100;
    dragBar.addEventListener("mousedown", (event) => {
      onDragging = true;
      x = event.clientX;
      y = event.clientY;
    });
    document.body.addEventListener("mousemove", (event) => {
      if (onDragging) {
        simulator.style.left = `${
          (parseInt(simulator.style.left) || initLeft) + event.clientX - x
        }px`;
        simulator.style.top = `${
          (parseInt(simulator.style.top) || initTop) + event.clientY - y
        }px`;
        x = event.clientX;
        y = event.clientY;
      }
    });
    dragBar.addEventListener("mouseup", (event) => {
      onDragging = false;
    });
  }
}

export default MessageSimulator;
