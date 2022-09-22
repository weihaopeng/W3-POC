const StateMachine = require('javascript-state-machine')
const _ = require('lodash')
const debug = require('debug')('aa:fsmFactory')

const fsmFactory = {
  /**
   * 创建状态机，作为属性或对象
   * @param def 状态机定义
   * @param target 状态机要应用的对象或属性
   *
   * 注意：当状态机有异步监听器时，状态变迁也会变成异步，所以 fsm.goto和init要用异步方法
   */
  async create (def, target) {
    const fsm = target ? StateMachine.apply(target, def) : new StateMachine(def)
    if (fsm._状态名称) fsm.goto ? await fsm.goto(fsm._状态名称) : fsm.state = fsm._状态名称
    if (fsm.state === 'none') await fsm.init()
    return fsm
  },

  extendDefine (def) {
    def = {...def}
    def.methods = def.methods ? {...def.methods} : {}
    const onEnterState = def.methods.onEnterState
    Object.assign(def.methods, {
      // 查询变迁，便于写出精简的测例
      queryTransition (from, to, args) {
        const transitions = this._fsm.config.options.transitions
        const res = transitions.find(t =>
          (t.from === '*' || Array.isArray(t.from) ? t.from.includes(from) : t.from === from)
          && (Array.isArray(t.to) ? t.to.includes(to) : (to === (typeof t.to === 'function' ? t.to.apply(this, args) : t.to)))
        )
        return res && res.name
      },
      //
      // toJSON () {
      //   const res = _.omit(this, ['_fsm', 'toJSON', '_manager'])
      //   res._状态名称 = res.state // state是Accessor
      //   delete res.state
      //   return JSON.parse(JSON.stringify(res))
      // }
    })
    return def
  }
}

const createFactory = (def) => {
  def = fsmFactory.extendDefine(def)
  return (target) => fsmFactory.create(def, target)
}

module.exports = { createFactory }
