export function getRandomNode(nodes) {
  const index = Math.floor(nodes.length * Math.random());
  return nodes[index];
}

export function getOtherNodes(nodes, id) {
  return nodes.filter((node) => node.id !== id);
}

export function getRandomNodeWithout(nodes, id) {
  const filtered = nodes.filter((node) => node.id !== id);
  return getRandomNode(filtered);
}

function getRandomBetween(min, max) {
  const range = max - min;
  return Math.floor(Math.random() * range) + min;
}

export function getRandomIp() {
  let str = `${getRandomBetween(0, 255)}`;
  for (let i = 0; i < 3; i++) {
    str += `.${getRandomBetween(0, 255)}`;
  }
  return str;
}

export function getRandomHash(length = 100) {
  let str = ""
  while(str.length < length) {
    str += ((Math.random() * 16) | 0).toString(16);
  }
  return `0x${str}`;
}

export function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve('done'), time)
  });
}
