const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server-core')
const { ObjectID } = require('bson-ext')

if (!process.env.MONGO_BINARY_VERSION) {
  console.error('Environment var MONGO_BINARY_VERSION is missing')
  process.exit(1)
}
const mongod = new MongoMemoryServer({
  binary: { version: String(process.env.MONGO_BINARY_VERSION) },
})

/**
 * Connect to the in-memory database.
 */
const connect = async () => {
  const uri = await mongod.getConnectionString()

  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }

  await mongoose.connect(uri, mongooseOpts)
}

/**
 * Drop database, close the connection and stop mongod.
 */
const closeDatabase = async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongod.stop()
}

/**
 * Remove all the data for all db collections.
 */
const clearDatabase = async () => {
  const collections = mongoose.connection.collections

  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany()
  }
}

// TODO: Remove this function and all references once all schemas are using the
// default mongoose instance.
/**
 * Creates Mongoose model.
 * @param {string} modelFilename Name of file which exports model in app/models
 * @param {string} modelName Name of exported model
 */
const makeModel = (modelFilename, modelName) => {
  if (modelName !== undefined && modelName !== null) {
    // check if model has already been compiled
    try {
      return mongoose.connection.model(modelName)
    } catch (error) {
      if (error.name !== 'MissingSchemaError') {
        console.error(error)
      }
      // else fail silently as we will create the model
    }
  }

  // Need this try catch block as some schemas may have been converted to
  // TypeScript and use default exports instead, or does not require a
  // connection
  try {
    return require(`../../../../dist/backend/app/models/${modelFilename}`)(
      mongoose,
    )
  } catch (e) {
    try {
      return require(`../../../../dist/backend/app/models/${modelFilename}`).default(
        mongoose,
      )
    } catch (e) {
      return require(`../../../../dist/backend/app/models/${modelFilename}`)
        .default
    }
  }
}

const preloadCollections = async (
  { userId, saveForm } = { saveForm: true },
) => {
  const Agency = makeModel('agency.server.model', 'Agency')
  const User = makeModel('user.server.model', 'User')
  const Form = makeModel('form.server.model', 'Form')

  const adminId = userId ? new ObjectID(userId) : new ObjectID()

  const agency = new Agency({
    shortName: 'govtest',
    fullName: 'Government Testing Agency',
    emailDomain: 'test.gov.sg',
    logo: '/invalid-path/test.jpg',
  })
  const user = new User({
    email: 'test@test.gov.sg',
    _id: adminId,
    agency: agency._id,
  })
  const form = new Form({
    title: 'Test Form',
    emails: 'test@test.gov.sg',
    admin: user._id,
  })

  await agency.save()
  await user.save()
  if (saveForm) {
    await form.save()
  }

  return {
    agency,
    user,
    form,
  }
}

module.exports = {
  connect,
  closeDatabase,
  clearDatabase,
  makeModel,
  preloadCollections,
}
