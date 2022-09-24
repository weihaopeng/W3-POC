/**
 * For github action to automatically update the Access Urls in README.md
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const readmePath = path.join(__dirname, '../../README.md')
const ipfsPath = process.argv[2]

const readCID = () => {
  const content = fs.readFileSync(ipfsPath, 'utf8')
  const cidList = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && true)
    .map((line) => {
      const [_, id, filename] = line.split(/\s+/)
      return id
    })
  return cidList[cidList.length - 1] // last one is what we want
}

const updateUrls = (CID) => {
  const readme = fs.readFileSync(readmePath, 'utf8')
  const newReadme = readme.replace(
    /(https:\/\/.+\/ipfs\/)(Qm[a-zA-Z0-9_-]+)/g,
    `$1${CID}`
  )
  fs.writeFileSync(readmePath, newReadme)
  console.log('Updated README.md Access Urls with new CID: ', process.argv[2])
}

updateUrls(readCID())
