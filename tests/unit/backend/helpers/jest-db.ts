import { ObjectID } from 'bson'
import { MongoMemoryServer } from 'mongodb-memory-server-core'
import mongoose, { Mongoose } from 'mongoose'

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

class DbHandler {
  #mongod?: MongoMemoryServer
  #connection?: Mongoose

  /**
   * Connect to the in-memory database
   */
  async connect(): Promise<Mongoose> {
    if (this.#connection) return this.#connection

    this.#mongod = await MongoMemoryServer.create({
      binary: {
        version: process.env.MONGO_BINARY_VERSION || '4.0.22',
        checkMD5: true,
      },
      instance: {},
    })

    const dbUrl = this.#mongod.getUri()

    this.#connection = await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    })

    return this.#connection
  }

  /**
   * Disconnect all mongoose connections.
   */
  async closeDatabase(): Promise<void> {
    await mongoose.disconnect()
    await this.#mongod?.stop()
  }

  /**
   * Remove all the data for all db collections.
   */
  async clearDatabase(): Promise<void> {
    const collections = mongoose.connection.collections

    for (const key in collections) {
      const collection = collections[key]
      await collection.deleteMany({})
    }
  }

  async clearCollection(collection: string): Promise<void> {
    await mongoose.connection.collections[collection].deleteMany({})
  }

  insertAgency = async ({
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

  insertUser = async ({
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
  insertFormCollectionReqs = async ({
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

    const agency = await this.insertAgency({ mailDomain, shortName })

    const user = await User.create({
      email: `${mailName}@${mailDomain}`,
      _id: userId ?? new ObjectID(),
      agency: agency.id,
    })

    return { agency, user }
  }

  insertEmailForm = async ({
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
    const { user, agency } = await this.insertFormCollectionReqs({
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

  insertEncryptForm = async ({
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
    const { user, agency } = await this.insertFormCollectionReqs({
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

  getFullFormById = async (formId: string): Promise<IPopulatedForm | null> =>
    await getEmailFormModel(mongoose).getFullFormById(formId)
}

export default new DbHandler()
