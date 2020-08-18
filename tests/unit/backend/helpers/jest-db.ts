import mongoSetup from '@shelf/jest-mongodb/setup'
import mongoTeardown from '@shelf/jest-mongodb/teardown'
import { ObjectID } from 'bson'
import mongoose from 'mongoose'

import getAgencyModel from 'src/app/models/agency.server.model'
import getUserModel from 'src/app/models/user.server.model'

/**
 * Connect to the in-memory database using MONGO_URL exposed by
 * \@shelf/jest-mongodb.
 */
const connect = async () => {
  // Do it here so each test can have it's own mongoose instance.
  await mongoSetup()
  // process.env.MONGO_URL is now set by jest-mongodb.
  const conn = await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  return conn
}

/**
 * Disconnect all mongoose connections.
 */
const closeDatabase = async () => {
  await mongoose.disconnect()
  await mongoTeardown()
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

const clearCollection = async (collection: string) => {
  await mongoose.connection.collections[collection].deleteMany({})
}

const insertDefaultAgency = async ({
  mailDomain = 'test.gov.sg',
}: {
  mailDomain?: string
} = {}) => {
  const Agency = getAgencyModel(mongoose)
  const agency = await Agency.create({
    shortName: 'govtest',
    fullName: 'Government Testing Agency',
    emailDomain: [mailDomain],
    logo: '/invalid-path/test.jpg',
  })

  return agency
}

/**
 * Inserts a default agency and user document into their respective collections.
 * This is required to create a Form document, as Form pre-validation hook
 * requires a valid user to be found in the collection
 * @param userId if provided, the User document will be created with the given user id
 */
const insertFormCollectionReqs = async ({
  userId,
  mailDomain = 'test.gov.sg',
  mailName = 'test',
}: {
  userId?: ObjectID
  mailName?: string
  mailDomain?: string
}) => {
  const User = getUserModel(mongoose)

  const agency = await insertDefaultAgency({ mailDomain })

  const user = await User.create({
    email: `${mailName}@${mailDomain}`,
    _id: userId,
    agency: agency.id,
  })

  return { agency, user }
}

const dbHandler = {
  connect,
  closeDatabase,
  clearDatabase,
  insertDefaultAgency,
  insertFormCollectionReqs,
  clearCollection,
}

export default dbHandler
