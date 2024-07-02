import mongoose from 'mongoose'
import {
  BasicField,
  FormAuthType,
  FormResponseMode,
  MyInfoAttribute,
} from 'shared/types'

import { IFormModel } from 'src/types'

import {
  ALL_FIELDS as _ALL_FIELDS,
  NO_LOGIC,
  TEST_ALL_FIELDS_SHOWN_BY_LOGIC,
  TEST_FIELD_HIDDEN_BY_LOGIC,
  TEST_SUBMISSION_DISABLED_BY_CHAINED_LOGIC,
} from './constants'
import { test } from './fixtures'
import {
  createForm,
  createSubmissionTestRunnerForResponseMode,
  verifySubmissionDisabled,
} from './helpers'
import {
  createBlankVersion,
  createMyInfoField,
  createOptionalVersion,
  deleteDocById,
  getEncryptSettings,
  makeModel,
  makeMongooseFixtures,
} from './utils'

// TODO: Attachment fields don't work on storage mode unless we spin up localstack.
const ALL_FIELDS = _ALL_FIELDS.filter(
  (field) => field.fieldType !== BasicField.Attachment,
)

const runEncryptSubmissionTest = createSubmissionTestRunnerForResponseMode(
  FormResponseMode.Encrypt,
)

let db: mongoose.Connection
let Form: IFormModel

test.describe('Storage form submission', () => {
  test.beforeAll(async () => {
    // Create models
    db = await makeMongooseFixtures()
    Form = makeModel(db, 'form.server.model', 'Form')
  })
  test.afterAll(async () => {
    // Clean up db
    await db.dropCollection(Form.collection.name)
    await db.close()
  })

  test('Create and submit storage mode form with all fields', async ({
    page,
  }) => {
    // Define
    const formFields = ALL_FIELDS
    const formLogics = NO_LOGIC
    const formSettings = getEncryptSettings()

    // Test
    await runEncryptSubmissionTest(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
  })

  test('Create and submit storage mode form with all fields optional', async ({
    page,
  }) => {
    // Define
    const formFields = ALL_FIELDS.map((ff) =>
      createBlankVersion(createOptionalVersion(ff)),
    )
    const formLogics = NO_LOGIC
    const formSettings = getEncryptSettings()

    // Test
    await runEncryptSubmissionTest(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
  })

  test('Create and submit storage mode form with all fields shown by logic', async ({
    page,
  }) => {
    // Define
    const { formFields, formLogics } = TEST_ALL_FIELDS_SHOWN_BY_LOGIC
    const formSettings = getEncryptSettings()

    // Test
    await runEncryptSubmissionTest(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
  })

  test('Create and submit storage mode form with a field hidden by logic', async ({
    page,
  }) => {
    // Define
    const { formFields, formLogics } = TEST_FIELD_HIDDEN_BY_LOGIC
    const formSettings = getEncryptSettings()

    // Test
    await runEncryptSubmissionTest(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
  })

  test('Create storage mode form with submission disabled by chained logic', async ({
    page,
  }) => {
    // Define
    const { formFields, formLogics, preventSubmitMessage } =
      TEST_SUBMISSION_DISABLED_BY_CHAINED_LOGIC
    const formSettings = getEncryptSettings()

    // Test
    const { form } = await createForm(page, Form, FormResponseMode.Encrypt, {
      formFields,
      formLogics,
      formSettings,
    })
    await verifySubmissionDisabled(
      page,
      { form, formFields, formSettings },
      preventSubmitMessage,
    )
    await deleteDocById(Form, form._id)
  })

  test('Create and submit storage mode form with MyInfo fields', async ({
    page,
  }) => {
    // Define
    const formFields = [
      // Short answer
      createMyInfoField(MyInfoAttribute.Name, 'LIM YONG XIANG', true),
      // Dropdown
      createMyInfoField(MyInfoAttribute.Sex, 'MALE', true),
      // Date
      createMyInfoField(MyInfoAttribute.DateOfBirth, '06/10/1980', true),
      // Mobile
      createMyInfoField(MyInfoAttribute.MobileNo, '97399245', false),
      // Unverified
      createMyInfoField(MyInfoAttribute.WorkpassStatus, 'Live', false),
    ]
    const formLogics = NO_LOGIC
    const formSettings = getEncryptSettings({
      authType: FormAuthType.MyInfo,
    })

    // Test
    await runEncryptSubmissionTest(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
  })
})
