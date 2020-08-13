import mongoSetup from '@shelf/jest-mongodb/setup'
import mongoTeardown from '@shelf/jest-mongodb/teardown'
import { ObjectID } from 'bson'
import mongoose from 'mongoose'

import getAgencyModel from 'src/app/models/agency.server.model'
import { getEncryptedFormModel } from 'src/app/models/form.server.model'
import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import getUserModel from 'src/app/models/user.server.model'

import { ResponseMode, SubmissionType } from '../../../../src/types'

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
  encryptedContent = 'encrypted-content',
  verifiedContent = 'verified-content',
  publicKey = 'fake-public-key',
  title = 'Test Form',
}: {
  userId?: ObjectID
  mailName?: string
  mailDomain?: string
  encryptedContent?: string
  verifiedContent?: string
  publicKey?: string
  title?: string
}) => {
  const Agency = getAgencyModel(mongoose)
  const User = getUserModel(mongoose)
  const EncryptForm = getEncryptedFormModel(mongoose)
  const EncryptSubmission = getEncryptSubmissionModel(mongoose)

  const agency = await Agency.create({
    shortName: 'govtest',
    fullName: 'Government Testing Agency',
    emailDomain: [mailDomain],
    logo: '/invalid-path/test.jpg',
  })

  const user = await User.create({
    email: `${mailName}@${mailDomain}`,
    _id: userId ?? new ObjectID(),
    agency: agency.id,
  })

  const encryptForm = await EncryptForm.create({
    title,
    admin: user._id,
    responseMode: ResponseMode.Encrypt,
    publicKey,
  })

  const encryptSubmission = await EncryptSubmission.create({
    form: encryptForm._id,
    submissionType: SubmissionType.Encrypt,
    encryptedContent,
    verifiedContent,
    version: 1,
    authType: encryptForm.authType,
    myInfoFields: [],
    webhookResponses: [],
  })

  return { agency, user, encryptForm, encryptSubmission }
}

const dbHandler = {
  connect,
  closeDatabase,
  clearDatabase,
  insertFormCollectionReqs,
}

export default dbHandler
