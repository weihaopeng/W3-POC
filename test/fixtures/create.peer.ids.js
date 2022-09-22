import { createEd25519PeerId, createRSAPeerId } from '@libp2p/peer-id-factory'
import fs from 'node:fs'
import { toString } from 'uint8arrays'


const peerIdToJSON = (peerId) => {
  // return await createFromParts(uint8ArrayFromString(obj.id, 'base58btc'), obj.privKey != null ? uint8ArrayFromString(obj.privKey, 'base64pad') : undefined, obj.pubKey != null ? uint8ArrayFromString(obj.pubKey, 'base64pad') : undefined);
  return {
    id: peerId.toString(),
    privKey: peerId.privateKey ? toString(peerId.privateKey, 'base64pad') : undefined,
    pubKey: peerId.publicKey ? toString(peerId.publicKey, 'base64pad') : undefined
  }
}


const savePeerIdsInFile = async (n) => {
  const jsons = await Promise.all([...new Array(n)].map(_ => createRSAPeerId()))
  fs.writeFileSync( './fixtures/peer.ids.json', JSON.stringify(jsons.map(peerIdToJSON)))
}

savePeerIdsInFile(10).then(_ => console.log('done'))
