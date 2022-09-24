# w3-poc
W3 POC is a large-scale P2P application protocol testbed based on IPFS and Libp2p for testing W3.   

W3 is a in new kind of blockchain, i.e. Consensusless Blockchain. It drops the most expensive part of traditional blockchains, 
the consensus, and therefore simpler, cheaper and faster. 

## How does it work?
Basically W3 POC is a javascript DApp, it implements the W3 consensusless blockchain protocol with a swarm of W3 Nodes 
within a webpage and then connected all swarms into a large testbed. Nodes pass messages through EventEmitter2 within 
a swarm and then through libp2p across swarms. 

![img](design/W3%20POC%20ETH%20Hackathon.png)


Vue and ECharts are used for visualization. Meanwhile, a Github CI/CD action is setup for automatically distribute the whole DApp via IPFS, 
and the web3.storage will be used soon to record/publish the testing results.

## Features
* [x] illustration & debug for the W3 protocol
* [x] benchmark of performance & resource consumption
* [ ] simulation on security attacks (in process)

## Access now

### GA

* Project Gateway https://w3-poc.huanglab.io/
* IPFS Gateway https://ipfs.io/ipns/w3-poc.huanglab.io

### Snapshot

* Project Gateway https://3.112.126.56/ipfs/QmZ4jryqwodosFfdQT74xJom8jJJ6hxRr8qNcm6EsopP8C
* IPFS Gateway https://ipfs.io/ipfs/QmZ4jryqwodosFfdQT74xJom8jJJ6hxRr8qNcm6EsopP8C

## Getting started
### development
```
npm install
npm run dev
```
Then visit http://localhost:3000 (default)
### build and preview
```
npm run build
npm run serve
```
Then visit http://localhost:4173 (default)

## References
1. [W3 Whitepaper](https://wiki.mq-ai.cn/display/WEB3/W3+Whitepaper) (beta release soon)
2. [Consensusless Blockchain: A Promising High-Performance Blockchain without Consensus](https://arxiv.org/abs/2208.12381)   
3. [区块链不需要挖矿——无共识区块链](https://zhuanlan.zhihu.com/p/557733758) (Chinese)   

## Contributing

## Team

### Core team 💪

* [@eric](https://github.com/ericwangqing) 🎈 _(founder, project lead, technical product owner, architect)_
* [@jian](https://github.com/Jianru-Lin) ⛷ _(tech lead + core engineer)_
* [@hao](https://github.com/weihaopeng) ⛷ _(core engineer)_

### Collaborators ❤

Welcome to contribute 👋

## License

[MIT](./LICENSE-MIT)


