import { ObjectID } from 'bson'
import mongoose from 'mongoose'

import getAgencyModel from 'src/app/models/agency.server.model'
import getUserModel from 'src/app/models/user.server.model'

/**
 * Connect to the in-memory database using MONGO_URL exposed by
 * \@shelf/jest-mongodb.
 */
const connect = async () => {
  return mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
}

/**
 * Drop database and close the connection.
 */
const closeDatabase = async () => {
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

/**
 * Inserts a default agency and user document into their respective collections.
 * This is required to create a Form document, as Form pre-validation hook
 * requires a valid user to be found in the collection
 * @param userId if provided, the User document will be created with the given user id
 */
const insertFormCollectionReqs = async (userId?: ObjectID) => {
  const Agency = getAgencyModel(mongoose)
  const User = getUserModel(mongoose)

  const agency = await Agency.create({
    shortName: 'govtest',
    fullName: 'Government Testing Agency',
    emailDomain: ['test.gov.sg'],
    logo: '/invalid-path/test.jpg',
  })

  const user = await User.create({
    email: 'test@test.gov.sg',
    _id: userId,
    agency: agency.id,
  })

  return { agency, user }
}

const dbHandler = {
  connect,
  closeDatabase,
  clearDatabase,
  insertFormCollectionReqs,
}

export default dbHandler
