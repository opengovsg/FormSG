import mongoose, { Model } from 'mongoose'

// Get absolute path of file
const spec = (path: string): any => {
  const fullPath = `${process.env.PWD}/${path}`
  return require(fullPath)
}

/**
 * Connects to mongo-memory-server instance.
 */
export const makeMongooseFixtures = (): Promise<mongoose.Connection> => {
  const dbUri = 'mongodb://127.0.0.1:3000/test' // TODO: hardcoding uri as the port and path are fixed and doesn't respect values in __tests__/e2e/setup/setupConfig.ts

  const connection = mongoose.createConnection(dbUri).asPromise()
  return connection
}

/**
 * Creates Mongoose model.
 * @param {Object} db Return value of makeMongooseFixtures
 * @param {string} modelFilename Name of file which exports model in app/models
 * @param {string} modelName Name of exported model
 */
export const makeModel = (
  db: mongoose.Connection,
  modelFilename: string,
  modelName: string,
): any => {
  if (modelName !== undefined && modelName !== null) {
    // check if model has already been compiled
    try {
      return db.model(modelName)
    } catch (error) {
      if (error instanceof Error && error.name !== 'MissingSchemaError') {
        console.error(error)
      }
      // else fail silently as we will create the model
    }
  }

  return spec(`dist/backend/src/app/models/${modelFilename}`).default(db)
}

/**
 * Clears a collection of a document with the given id.
 * Usually used in 'after' hooks in tests.
 * @param {Model} collection MongoDB collection
 * @param {string} id document's ID as given by its _id field.
 */
export const deleteDocById = async (
  collection: Model<any>,
  id: string,
): Promise<void> => {
  await collection.deleteOne({ _id: id })
}
