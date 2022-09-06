import Debug from 'debug'
const debug = Debug('w3:fork')

class Fork {

  constructor (blocks) {
    this.blocks = blocks
  }

  get forkPoint() {
    return this.blocks[0]
  }

  get height() {
    return this.blocks.length - 1
  }
}

export { Fork }
