# W3-POC tech-spike

## How to start
1. run `npm run start` in the root of project directory.
1. visit `${host}/tech-spike/swarm.html` or `${host}/tech-spike/network.html`

## The render logic

```javascript
const DELAY_FOR_VIEW = 1000 // 为方便视觉呈现所做的延时。例如收到TX后节点计算BP，假设计算很快，那么节点上的样式会突变。这里加这个延时，以延缓tx的消失
```

1. Swarm Style:
    1. default: Simple image with label text, lines connecting every two nodes is opacity 0.
    1. departure: Source node highlight, a nearby tooltip with specific shape to show message type. The line connecting source and target changes to opacity 1.
    1. arrive: Target node highlight, a nearby tooltip with specific shape to show message type and specific background color to show the result of node verify. After `${DELAY_FOR_VIEW}`ms, the two nodes downplay, outdated tooltips disappear and line turn to opacity 0.
    1. The `fork` and `verify` message will be explained sooner.
1. Chain, Block, BP style:
    1. A vertical layout of multiple cards of which present the basic information of block or bp.
    1. append: 
        1. A BP append to `BP container` when the client receives a network message with `type: bp`.
        1. A Block append to `Block container` when the client receives a network message with `type: block`.
        1. A Block append to `Chain container` when the client receives a chain message with event `blockAdded`.

## Driven case

```javascript
// 这些变量是在模拟消息发出时使用，正式场景下，由p2p网络决定，与上面的渲染无关。
const DELAY_FOR_VIEW = 2000 // 为方便观测所做的基础延时。例如消息发出后，等待时长后，再进行接收。
const DELAY_CHURN_THRESHOLD = 200 // 波动产生的额外时间
const DELAY_FILTER_RATIO = 0.2 // 因波动进行过滤的节点比例

const communicateCost = DELAY_FOR_VIEW + Math.random() * DELAY_CHURN_THRESHOLD // 以上面参数为例，每个节点通信时长在 2000 ~ 2200ms，其中超过2160ms的视为超时
const legalCommunicateCost = DELAY_FOR_VIEW + (1 - DELAY_FILTER_RATIO) * DELAY_CHURN_THRESHOLD // 以上面参数为例，通信时长小于2160ms的视为合法

const calculateCost = Math.random() * 500 + 500 // 每个节点计算耗时在500 ~ 1000ms内波动
```

Perform 10 rounds, each round:
1. From random node, broadcast a `tx` message to other nodes.
    1. Broadcast a `network.msg with type:tx, action:departure`.
    1. Filter legal node as collector using `legalCommunicateCost`(the fastest receiver for now), After `${communicateCost}`ms, send a `network.msg with type:tx, action:arrive`.
1. collector after `calculateCost`ms, send a `network.msg with type:bp, action:departure` to random three other nodes. The next broadcast process is the same as the first one above. The receiver is *witness*.
1. witness send receive msg, then calculate, then send message same as the steps above for another two rounds.
3. In the 3rd round, the witness broadcasts the block message to all other nodes, and at the same time send a `chain.blockAdded` message.
