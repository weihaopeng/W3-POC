const debug = require('debug')('fsm:test')

const asyncSome = async (arr, predicate) => {
  for (let i = 0; i < arr.length; i++) {
    if (await predicate(arr[i], i)) return true;
  }
  return false
}


/**
 * 检查给定的状态变迁路线是否合法，例如：
 *     查看任务 -> 离开了孩子端 -> 返回页面:查看任务 -> 完成作业
 *
 * TODO: 这里要改进，现在放合法路径进来，也能顺利通过。
 * @see prototype/test/unit/Room.状态机.test.js
 */
const checkStateRoute =  async (fsm, defStr, assertionNegative = false) => {
  if (defStr.match(/^\s*不能[:：]/)) assertionNegative = true
  defStr = defStr.replace(/^\s*不能[:：]/, '')
  const states = defStr.split(/\s*->\s*/).map(s => s.trim()).map(s => {
    const [状态, 变迁] = s.split(/[:：]/).reverse().map(s => s.trim())
    return { 状态, 变迁 }
  })
  await fsm.goto(states[0].状态)
  await asyncSome(states, async (current, i) => {
    assertionNegative || fsm.state.should.eqls(current.状态)
    if (i === states.length - 1) return false
    const next = states[i + 1]
    const transiton = next.变迁 || fsm.queryTransition(current.状态, next.状态)
    if (!transiton && assertionNegative) return true
    if (!transiton) throw new Error(`无法找到变迁：${current.状态} -> ${next.状态}`)
    const res = await fsm[transiton]()
    debug('%d. 变迁 %s:\t %s → %s \t\t\t OK: %o', i + 1, transiton, current, next, fsm)
  })
  debug('\n')
  return false
}


module.exports = { asyncSome, checkStateRoute }
