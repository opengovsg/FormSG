import mongoSetup from '@shelf/jest-mongodb/setup'
import mongoTeardown from '@shelf/jest-mongodb/teardown'
import { ObjectID } from 'bson'
import mongoose from 'mongoose'

import getAgencyModel from 'src/app/models/agency.server.model'
import getFormModel from 'src/app/models/form.server.model'
import getUserModel from 'src/app/models/user.server.model'
import {
  BasicField,
  IAgencySchema,
  IField,
  IFormSchema,
  ITableField,
  IUserSchema,
  ResponseMode,
} from 'src/types'

/**
 * Connect to the in-memory database using MONGO_URL exposed by
 * \@shelf/jest-mongodb.
 */
const connect = async (): Promise<typeof mongoose> => {
  // Do it here so each test can have it's own mongoose instance.
  await mongoSetup()
  // process.env.MONGO_URL is now set by jest-mongodb.
  const conn = await mongoose.connect(process.env.MONGO_URL ?? '', {
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
  await mongoose.disconnect()
  await mongoTeardown()
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
}: {
  formId?: ObjectID
  userId?: ObjectID
  mailName?: string
  mailDomain?: string
  shortName?: string
} = {}): Promise<{
  form: IFormSchema
  user: IUserSchema
  agency: IAgencySchema
}> => {
  const { user, agency } = await insertFormCollectionReqs({
    userId,
    mailDomain,
    mailName,
    shortName,
  })

  const Form = getFormModel(mongoose)

  const form = await Form.create({
    title: 'example form title',
    admin: user._id,
    responseMode: ResponseMode.Email,
    emails: [user.email],
    _id: formId,
  })

  return {
    form,
    user,
    agency,
  }
}

const generateDefaultField = (
  fieldType: BasicField,
  customParams?: Partial<IField>,
): IField | ITableField => {
  const defaultParams = {
    title: `test ${fieldType} field title`,
    _id: new ObjectID().toHexString(),
    description: `${fieldType} description`,
    globalId: new ObjectID().toHexString(),
    fieldType,
    required: true,
    disabled: false,
  }
  if (fieldType === BasicField.Table) {
    return {
      minimumRows: 1,
      columns: [
        {
          title: 'Test Column Title 1',
          required: true,
          columnType: BasicField.ShortText,
        },
        {
          title: 'Test Column Title 2',
          required: true,
          columnType: BasicField.Dropdown,
        },
      ],
      ...defaultParams,
      ...customParams,
    }
  }

  return {
    ...defaultParams,
    ...customParams,
  }
}

const dbHandler = {
  connect,
  closeDatabase,
  clearDatabase,
  insertAgency,
  insertUser,
  insertFormCollectionReqs,
  clearCollection,
  insertEmailForm,
  generateDefaultField,
}

export default dbHandler
