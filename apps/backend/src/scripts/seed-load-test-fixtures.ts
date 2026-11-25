import {
  BasicField,
  FormAuthType,
  FormResponseMode,
  FormStatus,
} from 'formsg-shared/types'
import mongoose, { Types } from 'mongoose'

import config from '../app/config/config'
import formsgSdk from '../app/config/formsg-sdk'
import { createLoggerWithLabel } from '../app/config/logger'
import loadMongoose from '../app/loaders/mongoose'
import getAgencyModel from '../app/models/agency.server.model'
import { getEncryptedFormModel } from '../app/models/form.server.model'
import getSubmissionModel from '../app/models/submission.server.model'
import getUserModel from '../app/models/user.server.model'

const logger = createLoggerWithLabel(module)

const AGENCY_ID = new Types.ObjectId('6c6f61647465737400000001')
const USER_ID = new Types.ObjectId('6c6f61647465737400000002')

const ADMIN_EMAIL = 'success@simulator.amazonses.com'
const AGENCY_DOMAIN = 'simulator.amazonses.com'

const FIXTURES = [
  {
    name: 'typical',
    id: new Types.ObjectId('6c6f61647465737400000011'),
    fieldCount: Number(process.env.FIXTURE_TYPICAL_FIELD_COUNT ?? 10),
  },
  {
    name: 'large',
    id: new Types.ObjectId('6c6f61647465737400000012'),
    fieldCount: Number(process.env.FIXTURE_LARGE_FIELD_COUNT ?? 100),
  },
]

const FIELD_PATTERN = [
  BasicField.ShortText,
  BasicField.ShortText,
  BasicField.LongText,
  BasicField.Number,
  BasicField.Radio,
  BasicField.Dropdown,
  BasicField.Checkbox,
  BasicField.YesNo,
  BasicField.ShortText,
  BasicField.LongText,
]

const options = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, i) => `${prefix} ${i + 1}`)

const buildField = (index: number) => {
  const fieldType = FIELD_PATTERN[index % FIELD_PATTERN.length]
  const base = {
    _id: new Types.ObjectId(),
    title: `Question ${index + 1}`,
    description: '',
    required: true,
    fieldType,
  }
  switch (fieldType) {
    case BasicField.Radio:
      return { ...base, fieldOptions: options('Option', 5) }
    case BasicField.Dropdown:
      return { ...base, fieldOptions: options('Choice', 20) }
    case BasicField.Checkbox:
      return { ...base, fieldOptions: options('Box', 4) }
    default:
      return base
  }
}

const seed = async () => {
  if (config.envSiteName === 'prod') {
    throw new Error('Refusing to seed load test fixtures in production')
  }
  if (!config.envSiteName && !config.isDev) {
    throw new Error('Refusing to seed load test fixtures: no SSM_ENV_SITE_NAME')
  }
  await loadMongoose()

  const Agency = getAgencyModel(mongoose)
  const User = getUserModel(mongoose)
  const EncryptedForm = getEncryptedFormModel(mongoose)
  const Submission = getSubmissionModel(mongoose)

  await Agency.updateOne(
    { _id: AGENCY_ID },
    {
      $set: {
        shortName: 'loadtest',
        fullName: 'FormSG Load Test',
        emailDomain: [AGENCY_DOMAIN],
        logo: '/public/modules/core/img/logo-ogp.svg',
      },
    },
    { upsert: true },
  )

  await User.updateOne(
    { _id: USER_ID },
    { $set: { email: ADMIN_EMAIL, agency: AGENCY_ID } },
    { upsert: true },
  )

  for (const fixture of FIXTURES) {
    const formFields = Array.from({ length: fixture.fieldCount }, (_, i) =>
      buildField(i),
    )
    const settings = {
      title: `Load test: ${fixture.name}`,
      admin: USER_ID,
      status: FormStatus.Public,
      authType: FormAuthType.NIL,
      hasCaptcha: false,
      hasIssueNotification: false,
      emails: [],
      webhook: { url: '', isRetryEnabled: false },
      submissionLimit: null,
      form_fields: formFields,
      form_logics: [],
    }

    const existing = await EncryptedForm.findById(fixture.id)
    if (existing) {
      existing.set(settings)
      await existing.save()
    } else {
      await EncryptedForm.create({
        _id: fixture.id,
        responseMode: FormResponseMode.Encrypt,
        publicKey: formsgSdk.crypto.generate().publicKey,
        ...settings,
      })
    }

    const { deletedCount } = await Submission.deleteMany({ form: fixture.id })
    logger.info({
      message: 'Seeded load test fixture',
      meta: {
        action: 'seedLoadTestFixtures',
        fixture: fixture.name,
        formId: fixture.id.toHexString(),
        fieldCount: fixture.fieldCount,
        submissionsCleared: deletedCount,
      },
    })
  }
}

seed()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({
      message: 'Failed to seed load test fixtures',
      meta: { action: 'seedLoadTestFixtures' },
      error,
    })
    process.exit(1)
  })
