import mongoose from 'mongoose'

/**
 * Connect to the in-memory database using MONGO_URL exposed by
 * \@shelf/jest-mongodb.
 */
const connect = async () => {
  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
}

/**
 * Drop database and close the connection.
 */
const closeDatabase = async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
}

/**
 * Remove all the data for all db collections.
 */
const clearDatabase = async () => {
  const collections = mongoose.connection.collections

  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
}

const dbHandler = {
  connect,
  closeDatabase,
  clearDatabase,
}

export default dbHandler
