import { MongoMemoryReplSet } from 'mongodb-memory-server-core'
import mongoose, { Model } from 'mongoose'

let replSet: MongoMemoryReplSet | undefined

/**
 * Connect to an in-memory single-node replica set, which supports transactions
 */
const connect = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  models: Model<any>[] = [],
): Promise<typeof mongoose> => {
  replSet = await MongoMemoryReplSet.create({
    binary: { version: process.env.MONGO_BINARY_VERSION || '6.0.19' },
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  })
  const conn = await mongoose.connect(replSet.getUri(), {
    directConnection: true,
  })
  for (const model of models) {
    await model.init()
  }
  return conn
}

/**
 * Remove all documents, keeping collections and indexes
 */
const clearDatabase = async (): Promise<void> => {
  const collections = await mongoose.connection.db.collections()
  for (const collection of collections) {
    await collection.deleteMany({})
  }
}

const closeDatabase = async (): Promise<void> => {
  await mongoose.disconnect()
  await replSet?.stop()
  replSet = undefined
}

const replSetDbHandler = { connect, clearDatabase, closeDatabase }

export default replSetDbHandler
