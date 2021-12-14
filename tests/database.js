const { MongoMemoryServer } = require('mongodb-memory-server-core')

class MemoryDatabaseServer {
  constructor() {}

  async init() {
    this.mongod = await MongoMemoryServer.create({
      binary: {
        version: process.env.MONGO_BINARY_VERSION || '4.0.22',
        skipMD5: true,
      },
      instance: {},
      autoStart: false,
    })
  }

  async start() {
    if (!this.mongod) {
      await this.init()
    }
    return this.mongod.start()
  }

  stop() {
    if (this.mongod) {
      return this.mongod.stop()
    }
  }

  async getConnectionString() {
    if (!this.mongod) {
      await this.init()
    }
    return this.mongod.getUri(true)
  }
}

module.exports = new MemoryDatabaseServer()
