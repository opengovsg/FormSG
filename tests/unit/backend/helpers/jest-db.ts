import { ObjectID } from 'bson'
import mongoose from 'mongoose'

import getAgencyModel from 'src/app/models/agency.server.model'
import getFormModel from 'src/app/models/form.server.model'
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

const preloadCollections = async (
  { userId, saveForm }: { userId?: ObjectID; saveForm?: boolean } = {
    saveForm: true,
  },
) => {
  const Agency = getAgencyModel(mongoose)
  const User = getUserModel(mongoose)
  const Form = getFormModel(mongoose)

  const adminId = userId ?? new ObjectID()

  const agency = await Agency.create({
    shortName: 'govtest',
    fullName: 'Government Testing Agency',
    emailDomain: ['test.gov.sg'],
    logo: '/invalid-path/test.jpg',
  })
  const user = await User.create({
    email: 'test@test.gov.sg',
    _id: adminId,
    agency: agency.id,
  })

  const form = saveForm
    ? await Form.create({
        title: 'Test Form',
        emails: ['test@test.gov.sg'],
        admin: user.id,
      })
    : undefined

  return {
    agency,
    user,
    form,
  }
}

const dbHandler = {
  connect,
  closeDatabase,
  clearDatabase,
  preloadCollections,
}

export default dbHandler
