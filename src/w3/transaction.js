class Transaction {
  constructor ({ to, from, value }) {
    Object.assign(this, {to, from, value})
  }

  static sort (a, b) {
      const r = a.from - b.from
      return r !== 0 ? r : a.to - b.to
    }
}

export { Transaction }
