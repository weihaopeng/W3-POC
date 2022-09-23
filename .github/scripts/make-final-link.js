import fs from 'fs'

const inputFile = process.argv[2]
const outputFile = process.argv[3]
if (!inputFile || !outputFile) {
  console.log('Usage: node make-final-link <input-file> <output-file>')
  process.exit(0)
} else if (!fs.existsSync(inputFile)) {
  console.log('file not found: ' + inputFile)
  process.exit(1)
}

const content = fs.readFileSync(inputFile, 'utf-8')
const finalContent = [
  'Access from our IPFS Gateway:',
  makeNewContent('https://3.112.126.56/ipfs', content),
  'Access from public IPFS Gateway:',
  makeNewContent('https://ipfs.io/ipfs', content)
].join('\n\n')
fs.writeFileSync(outputFile, finalContent)

function makeNewContent(baseUrl, content) {
  const textLines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && true)
  const newLines = textLines.map((line) => {
    const [_, id, filename] = line.split(/\s+/)
    // return `${baseUrl}/${id}?filename=${encodeURIComponent(filename)}`
    return `${baseUrl}/${id}`
  })
  // only need last line (index.html)
  return newLines[newLines.length - 1]
}
