const { MongoMemoryServer } = require('mongodb-memory-server-core')

class MemoryDatabaseServer {
  constructor() {
    this.mongod = new MongoMemoryServer({
      binary: {
        version: process.env.MONGO_BINARY_VERSION || '4.0.22',
        checkMD5: true,
      },
      instance: {},
      autoStart: false,
    })
  }

  start() {
    return this.mongod.start()
  }

  stop() {
    return this.mongod.stop()
  }

  getConnectionString() {
    return this.mongod.getUri(true)
  }
}

module.exports = new MemoryDatabaseServer()
