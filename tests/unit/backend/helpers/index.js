// Increase upper bound for time-out so tests don't fail on travis
jasmine.DEFAULT_TIMEOUT_INTERVAL = 100 * 1000

const proxyquire = require('proxyquire')

global.spec = (path, proxy) => {
  let fullPath = `${process.env.PWD}/${path}`
  if (proxy) {
    return proxyquire(fullPath, proxy)
  }
  return require(fullPath)
}

global._ = require('lodash')
