import { MongoMemoryServer } from 'mongodb-memory-server-core'
import mongoose from 'mongoose'

import setupConfig from './setupConfig'

async function globalSetup(): Promise<void> {
  if (setupConfig.Memory) {
    // Config to decided if an mongodb-memory-server instance should be used
    // it's needed in global space, because we don't want to create a new instance every test-suite
    // Unable to use latest mongodb-memory-server-core because of type conflicts until we upgrade mongoose.
    const mongod = new MongoMemoryServer({
      binary: {
        version: process.env.MONGO_BINARY_VERSION,
        checkMD5: true,
      },
    })

    const uri = await mongod.getUri(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global as any).__MONGOINSTANCE = mongod
    process.env.MONGO_URI = `${uri.slice(0, uri.lastIndexOf('/'))}/${
      setupConfig.Database
    }`
  } else {
    process.env.MONGO_URI = `mongodb://${setupConfig.IP}:${setupConfig.Port}`
  }

  // The following is to make sure the database is clean before an test starts
  await mongoose.connect(process.env.MONGO_URI, {
    // Avoid using deprecated URL string parser in MongoDB driver
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Avoid using deprecated collection.ensureIndex internally
    useCreateIndex: true,
    // upgrade to mongo driver's native findOneAndUpdate function instead of
    // findAndModify.
    useFindAndModify: false,
    promiseLibrary: global.Promise,
  })
  await mongoose.disconnect()
}

export default globalSetup
