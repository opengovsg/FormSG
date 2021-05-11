import { ObjectID } from 'bson'
import mongoose from 'mongoose'

import getAgencyModel from 'src/app/models/agency.server.model'
import {
  getEmailFormModel,
  getEncryptedFormModel,
} from 'src/app/models/form.server.model'
import getUserModel from 'src/app/models/user.server.model'
import {
  IAgencySchema,
  IEmailForm,
  IEmailFormSchema,
  IEncryptedForm,
  IEncryptedFormSchema,
  IPopulatedForm,
  IUserSchema,
  ResponseMode,
} from 'src/types'

import MemoryDatabaseServer from 'tests/database'

/**
 * Connect to the in-memory database
 */
const connect = async (): Promise<typeof mongoose> => {
  const dbUrl = await MemoryDatabaseServer.getConnectionString()

  const conn = await mongoose.connect(dbUrl, {
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
const closeDatabase = async (): Promise<void> => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongoose.disconnect()
  await MemoryDatabaseServer.stop()
}

/**
 * Remove all the data for all db collections.
 */
const clearDatabase = async (): Promise<void> => {
  const collections = mongoose.connection.collections

  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
}

const clearCollection = async (collection: string): Promise<void> => {
  await mongoose.connection.collections[collection].deleteMany({})
}

const insertAgency = async ({
  mailDomain = 'test.gov.sg',
  shortName = 'govtest',
}: {
  mailDomain?: string
  shortName?: string
} = {}): Promise<IAgencySchema> => {
  const Agency = getAgencyModel(mongoose)
  const agency = await Agency.create({
    shortName,
    fullName: `Government Testing Agency (${shortName})`,
    emailDomain: [mailDomain],
    logo: `/invalid-path/test-${shortName}.jpg`,
  })

  return agency
}

const insertUser = async ({
  agencyId,
  userId,
  mailDomain = 'test.gov.sg',
  mailName = 'test',
}: {
  agencyId: ObjectID
  userId?: ObjectID
  mailName?: string
  mailDomain?: string
}): Promise<IUserSchema> => {
  const User = getUserModel(mongoose)

  return User.create({
    email: `${mailName}@${mailDomain}`,
    _id: userId,
    agency: agencyId,
  })
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
  shortName = 'govtest',
}: {
  userId?: ObjectID
  mailName?: string
  mailDomain?: string
  shortName?: string
} = {}): Promise<{
  agency: IAgencySchema
  user: IUserSchema
}> => {
  const User = getUserModel(mongoose)

  const agency = await insertAgency({ mailDomain, shortName })

  const user = await User.create({
    email: `${mailName}@${mailDomain}`,
    _id: userId ?? new ObjectID(),
    agency: agency.id,
  })

  return { agency, user }
}

const insertEmailForm = async ({
  formId,
  userId,
  mailDomain = 'test.gov.sg',
  mailName = 'test',
  shortName = 'govtest',
  formOptions = {},
}: {
  formId?: ObjectID
  userId?: ObjectID
  mailName?: string
  mailDomain?: string
  shortName?: string
  formOptions?: Partial<IEmailForm>
} = {}): Promise<{
  form: IEmailFormSchema
  user: IUserSchema
  agency: IAgencySchema
}> => {
  const { user, agency } = await insertFormCollectionReqs({
    userId,
    mailDomain,
    mailName,
    shortName,
  })

  const EmailFormModel = getEmailFormModel(mongoose)
  const form = await EmailFormModel.create({
    title: 'example form title',
    admin: user._id,
    responseMode: ResponseMode.Email,
    emails: [user.email],
    _id: formId,
    ...formOptions,
  })

  return {
    form: form as IEmailFormSchema,
    user,
    agency,
  }
}

const insertEncryptForm = async ({
  formId,
  userId,
  mailDomain = 'test.gov.sg',
  mailName = 'test',
  shortName = 'govtest',
  formOptions = {},
}: {
  formId?: ObjectID
  userId?: ObjectID
  mailName?: string
  mailDomain?: string
  shortName?: string
  formOptions?: Partial<IEncryptedForm>
} = {}): Promise<{
  form: IEncryptedFormSchema
  user: IUserSchema
  agency: IAgencySchema
}> => {
  const { user, agency } = await insertFormCollectionReqs({
    userId,
    mailDomain,
    mailName,
    shortName,
  })

  const EncryptFormModel = getEncryptedFormModel(mongoose)

  const form = await EncryptFormModel.create({
    title: 'example form title',
    admin: user._id,
    responseMode: ResponseMode.Encrypt,
    _id: formId,
    publicKey: 'vuUYOfkrC7eiyqZ1OCZhMcjAvMQ7R4Z4zzDWB+og4G4=',
    ...formOptions,
  })

  return {
    form: form as IEncryptedFormSchema,
    user,
    agency,
  }
}

const getFullFormById = async (
  formId: string,
): Promise<IPopulatedForm | null> =>
  await getEmailFormModel(mongoose).getFullFormById(formId)

const dbHandler = {
  connect,
  closeDatabase,
  clearDatabase,
  insertAgency,
  insertUser,
  insertFormCollectionReqs,
  clearCollection,
  insertEmailForm,
  insertEncryptForm,
  getFullFormById,
}

export default dbHandler
