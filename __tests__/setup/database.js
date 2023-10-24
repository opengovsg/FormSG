const { MongoMemoryServer } = require('mongodb-memory-server-core')

class MemoryDatabaseServer {
  constructor() {
    this.mongod = new MongoMemoryServer({
      binary: {
        version: process.env.MONGO_BINARY_VERSION || '4.0.22',
        checkMD5: true,
      },
      instance: {},
    })
  }

  start() {
    return this.mongod.start()
  }

  stop() {
    return this.mongod.stop()
  }

  getConnectionString() {
    const randomUri = +new Date()
    return this.mongod.getUri(randomUri.toString())
  }
}

module.exports = new MemoryDatabaseServer()
