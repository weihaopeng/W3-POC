// [Reference]
// - https://github.com/libp2p/js-libp2p/blob/master/examples/webrtc-direct/dialer.js
import { CrossBrowser } from './lib'

document.addEventListener('DOMContentLoaded', run)

const serverPeerAddress = `/ip4/3.112.126.56/tcp/9090/http/p2p-webrtc-direct/p2p/12D3KooWCuo3MdXfMgaqpLC5Houi1TRoFqgK9aoxok4NK5udMu8m`

async function run() {
  await new CrossBrowser([serverPeerAddress]).start()
}
