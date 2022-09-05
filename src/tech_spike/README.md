Perform 10 rounds, each round:
1. From  random node, broadcast a `tx` message to other nodes.
    1. Node and path highlight to blue.
    2. The path cost is between 100 ~ 250ms, of which more than 200ms is regarded as timeout and will be discarded.
    3. Timeout node highlight to red and fade out in 30ms. All paths play down, the root node play down.
2. Three of the nodes that receives the tx message, broadcast the `bp` message to 3 random nodes after 50 ~ 70ms. In each broadcast, 1 of them is determined to be the witness, highlight as green, and after 50ms, the witness broadcasts the bp message to 3 random nodes for 3 rounds. When each round of messages is completed, BP graph adds message blocks. When begin to broadcast, add a block to Block graph.
3. In the 3rd round, the witness broadcasts the block message to all other nodes, and at the same time adds the block information block to the Chain graph.