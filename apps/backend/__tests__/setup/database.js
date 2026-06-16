const { MongoMemoryReplSet } = require('mongodb-memory-server-core')

// A single-member replica set (rather than a standalone MongoMemoryServer) so
// that multi-document transactions run under test. MRF step submissions write
// their submission_history snapshot atomically with the step in one
// transaction (ADR-0002); a standalone server rejects transactions outright.
class MemoryDatabaseServer {
  constructor() {
    this.mongod = new MongoMemoryReplSet({
      binary: {
        version: process.env.MONGO_BINARY_VERSION || '6.0.19',
        checkMD5: true,
      },
      replSet: { count: 1 },
    })
  }

  start() {
    return this.mongod.start()
  }

  stop() {
    return this.mongod.stop()
  }

  getConnectionString() {
    // Connect directly to the single member rather than via replica-set
    // discovery. The in-memory member advertises a hostname that may not
    // resolve, so `?replicaSet=...` makes the driver time out on server
    // selection (e.g. for populate queries). `directConnection=true` talks
    // straight to 127.0.0.1 and still supports transactions against a
    // replica-set member.
    return this.mongod
      .getUri()
      .replace(/\?replicaSet=[^&]+/, '?directConnection=true')
  }
}

module.exports = new MemoryDatabaseServer()
