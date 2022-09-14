import mockIp from './mock-ip-lng-lat.json'

class Address {
  constructor() {
    this.ipCache = {}
    mockIp.map((data) => {
      this.ipCache[data[0]] = {
        longitude: data[1],
        latitude: data[2],
      }
    })
  }

  randomIp() {
    return mockIp[Math.floor(Math.random() * mockIp.length)][0]
  }

  ip2LngLat(ip) {
    return this.ipCache[ip] || { longitude: 0, latitude: 0 }
  }

  // just an approximate value
  getAddressDistance(ip1, ip2) {
    const { latitude: lat1, longitude: lng1 } = this.ip2LngLat(ip1)
    const { latitude: lat2, longitude: lng2 } = this.ip2LngLat(ip2)
    return Math.sqrt((lat1 - lat2) ** (2 + (lng1 - lng2) ** 2)) * Math.sqrt(2) * 100
  }
}

export default new Address()
