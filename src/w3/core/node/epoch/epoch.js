import _ from 'lodash'
import { Chain } from '../../entities/chain.js'
import { ResetableEpoch } from './resetable-epoch.js'

class Epoch extends ResetableEpoch{

  constructor(node, config) {
    super(node)
    this.node = node
    this.height = this.node.chain.height
  }

  canWitness(height) {
    return height === this.height + 1
  }

  get tailHash() {
    return this.node.chain.getHashAtHeight(this.height)
  }

  get previous() {
    return {
      height: this.height - 1,
      tailHash: this.node.chain.getHashAtHeight(this.height - 1)
    }
  }

  // proceedNextEpoch () {
  //   delete this.nextEpochTimer
  //   this.afw = false
  //   this.height = this.node.chain.height
  //
  //   // release resources
  //   // 注意！这里有问题，drainPools之后，会导致双花判定不准，还有已上链的tx再出现被当做是新的tx，导致重复上链！~！暂停不用，优化时再说。
  //   // Chain.pruneCommonHeadBlocks(this.node.swarm.config.UNCONFIRMED_BLOCKS_HEIGHT)
  //   // this.node.localFacts.drainPools()
  //
  //   this.constructor.detectEpochHeightDifference() // use in dev. for observe the epoch height difference
  //   this.node.askForWitnessAndMintWhenProper()
  // }
}

export { Epoch }
