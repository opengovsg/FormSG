import { ObjectID } from 'bson'
import mongoose from 'mongoose'
import { FormResponseMode } from 'shared/types'

import getAgencyModel from 'src/app/models/agency.server.model'
import getFormModel, {
  getEmailFormModel,
  getEncryptedFormModel,
} from 'src/app/models/form.server.model'
import getFormFeedbackModel from 'src/app/models/form_feedback.server.model'
import getSubmissionModel from 'src/app/models/submission.server.model'
import getUserModel from 'src/app/models/user.server.model'
import {
  AgencyDocument,
  IAgencySchema,
  IEmailForm,
  IEmailFormSchema,
  IEncryptedForm,
  IEncryptedFormSchema,
  IForm,
  IFormFeedbackSchema,
  IFormSchema,
  IPopulatedForm,
  ISubmissionSchema,
  IUserSchema,
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
} = {}): Promise<AgencyDocument> => {
  const Agency = getAgencyModel(mongoose)
  const agency = (await Agency.create({
    shortName,
    fullName: `Government Testing Agency (${shortName})`,
    emailDomain: [mailDomain],
    logo: `/invalid-path/test-${shortName}.jpg`,
  })) as AgencyDocument

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
  flags,
}: {
  userId?: ObjectID
  mailName?: string
  mailDomain?: string
  shortName?: string
  flags?: { lastSeenFeatureUpdateVersion: number }
} = {}): Promise<{
  agency: AgencyDocument
  user: IUserSchema
}> => {
  const User = getUserModel(mongoose)

  const agency = await insertAgency({ mailDomain, shortName })

  const user = await User.create({
    email: `${mailName}@${mailDomain}`,
    _id: userId ?? new ObjectID(),
    agency: agency._id,
    flags: flags,
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
    responseMode: FormResponseMode.Email,
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
    responseMode: FormResponseMode.Encrypt,
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

const insertFormWithMsgSrvcName = async ({
  formId,
  userId,
  mailDomain = 'test.gov.sg',
  mailName = 'test',
  shortName = 'govtest',
  formOptions = {},
  msgSrvcName = 'mockMsgSrvcname',
}: {
  formId?: ObjectID
  userId?: ObjectID
  mailName?: string
  mailDomain?: string
  shortName?: string
  formOptions?: Partial<IForm>
  msgSrvcName?: string
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

  const FormModel = getFormModel(mongoose)
  const form = await FormModel.create({
    title: 'example form title',
    admin: user._id,
    _id: formId,
    ...formOptions,
    msgSrvcName: msgSrvcName,
  })

  return {
    form: form as IFormSchema,
    user,
    agency,
  }
}

const getFullFormById = async (
  formId: string,
): Promise<IPopulatedForm | null> =>
  await getFormModel(mongoose).getFullFormById(formId)

const insertFormSubmission = async ({
  formId,
  submissionType = 'encryptSubmission',
  version = '1',
  encryptedContent = 'encryptedContent',
}: {
  formId?: ObjectID
  submissionType?: string
  version?: string
  encryptedContent?: string
} = {}): Promise<{
  submission: ISubmissionSchema
}> => {
  const SubmissionModel = getSubmissionModel(mongoose)
  const submission = await SubmissionModel.create({
    form: formId,
    submissionType,
    encryptedContent,
    version,
  })

  return {
    submission: submission as ISubmissionSchema,
  }
}

const insertFormFeedback = async ({
  formId,
  submissionId,
  rating = '5',
  comment = 'FormSG rocks!',
}: {
  formId?: ObjectID
  submissionId?: ObjectID
  rating?: string
  comment?: string
} = {}): Promise<{
  formFeedback: IFormFeedbackSchema
}> => {
  const FormFeedbackModel = getFormFeedbackModel(mongoose)
  const formFeedback = await FormFeedbackModel.create({
    formId,
    comment,
    rating,
    submissionId,
  })

  return {
    formFeedback: formFeedback as IFormFeedbackSchema,
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
  insertEncryptForm,
  insertFormWithMsgSrvcName,
  getFullFormById,
  insertFormSubmission,
  insertFormFeedback,
}

export default dbHandler
