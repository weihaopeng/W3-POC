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
