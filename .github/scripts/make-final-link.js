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

const baseUrl = 'http://3.112.126.56:8080/ipfs'
const content = fs.readFileSync(inputFile, 'utf-8')
const textLines = content
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && true)
const newContent = textLines
  .map((line) => {
    const [_, id, filename] = line.split(/\s+/)
    return `${baseUrl}/${id}?filename=${encodeURIComponent(filename)}`
  })
  .join('\n')
fs.writeFileSync(outputFile, newContent)
