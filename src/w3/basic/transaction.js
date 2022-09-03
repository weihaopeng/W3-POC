class Transaction {
  constructor ({ i, to, from, value }) {
    Object.assign(this, {i, to, from, value})
  }

  static sort (a, b) {
      // const r = a.from.compareTo(b.from)
      // return r !== 0 ? r : a.to.compareTo(b.to)
    return a.i - b.i // TODO only for theory test
    }
}

export { Transaction }
