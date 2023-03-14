import mongoose from 'mongoose'
import {
  BasicField,
  FormAuthType,
  FormResponseMode,
  MyInfoAttribute,
} from 'shared/types'

import { IFormModel } from 'src/types'

import {
  ALL_FIELDS,
  E2eFieldMetadata,
  NO_LOGIC,
  SAMPLE_FIELD,
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
  getSettings,
  makeModel,
  makeMongooseFixtures,
} from './utils'

const runEmailSubmissionTest = createSubmissionTestRunnerForResponseMode(
  FormResponseMode.Email,
)

let db: mongoose.Connection
let Form: IFormModel

test.describe('Email form submission', () => {
  test.beforeAll(async () => {
    // Create models
    db = await makeMongooseFixtures()
    Form = makeModel(db, 'form.server.model', 'Form')
  })
  test.afterAll(async () => {
    // Clean up db
    db.models = {}
    await db.close()
  })

  test('Create and submit email mode form with all fields', async ({
    page,
  }) => {
    // Define
    const formFields = ALL_FIELDS
    const formLogics = NO_LOGIC
    const formSettings = getSettings()

    // Test
    await runEmailSubmissionTest(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
  })

  test('Create and submit email mode form with all fields optional', async ({
    page,
  }) => {
    // Define
    const formFields = ALL_FIELDS.map((ff) =>
      createBlankVersion(createOptionalVersion(ff)),
    )
    const formLogics = NO_LOGIC
    const formSettings = getSettings()

    // Test
    await runEmailSubmissionTest(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
  })

  test('Create and submit email mode form with identical attachment names', async ({
    page,
  }) => {
    // Define
    const baseField = SAMPLE_FIELD[BasicField.Attachment]
    const formFields = new Array(3).fill('').map(
      (_, i) =>
        ({
          ...baseField,
          title: `Attachment ${i}`,
          path: `__tests__/e2e/files/att-folder-${i}/test-att.txt`,
          val: `${i === 2 ? '' : `${2 - i}-`}test-att.txt`,
        } as E2eFieldMetadata),
    )
    const formLogics = NO_LOGIC
    const formSettings = getSettings()

    // Test
    await runEmailSubmissionTest(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
  })

  test('Create and submit email mode form with optional and required attachments', async ({
    page,
  }) => {
    // Define
    const baseField = SAMPLE_FIELD[BasicField.Attachment]
    const formFields = [
      {
        ...baseField,
        title: 'Attachment 0',
        path: '__tests__/e2e/files/att-folder-0/test-att.txt',
        val: '1-test-att.txt',
      } as E2eFieldMetadata,
      {
        ...createBlankVersion(createOptionalVersion(baseField)),
        title: 'Attachment 1',
      } as E2eFieldMetadata,
      {
        ...baseField,
        title: 'Attachment 2',
        path: '__tests__/e2e/files/att-folder-2/test-att.txt',
        val: 'test-att.txt',
      } as E2eFieldMetadata,
    ]
    const formLogics = NO_LOGIC
    const formSettings = getSettings()

    // Test
    await runEmailSubmissionTest(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
  })

  test('Create and submit email mode form with Singpass authentication', async ({
    page,
  }) => {
    // Define
    const formFields = ALL_FIELDS
    const formLogics = NO_LOGIC
    const formSettings = getSettings({
      authType: FormAuthType.SP,
    })

    // Test
    await runEmailSubmissionTest(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
  })

  test('Create and submit email mode form with Corppass authentication', async ({
    page,
  }) => {
    // Define
    const formFields = ALL_FIELDS
    const formLogics = NO_LOGIC
    const formSettings = getSettings({
      authType: FormAuthType.CP,
    })

    // Test
    await runEmailSubmissionTest(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
  })

  test('Create and submit email mode form with SGID authentication', async ({
    page,
  }) => {
    // Define
    const formFields = ALL_FIELDS
    const formLogics = NO_LOGIC
    const formSettings = getSettings({
      authType: FormAuthType.SGID,
    })

    // Test
    await runEmailSubmissionTest(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
  })

  test('Create and submit email mode form with MyInfo fields', async ({
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
    const formSettings = getSettings({
      authType: FormAuthType.MyInfo,
    })

    // Test
    await runEmailSubmissionTest(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
  })

  test('Create and submit email mode form with all fields shown by logic', async ({
    page,
  }) => {
    // Define
    const { formFields, formLogics } = TEST_ALL_FIELDS_SHOWN_BY_LOGIC
    const formSettings = getSettings()

    // Test
    await runEmailSubmissionTest(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
  })

  test('Create and submit email mode form with a field hidden by logic', async ({
    page,
  }) => {
    // Define
    const { formFields, formLogics } = TEST_FIELD_HIDDEN_BY_LOGIC
    const formSettings = getSettings()

    // Test
    await runEmailSubmissionTest(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
  })

  test('Create email mode form with submission disabled by chained logic', async ({
    page,
  }) => {
    // Define
    const { formFields, formLogics, preventSubmitMessage } =
      TEST_SUBMISSION_DISABLED_BY_CHAINED_LOGIC
    const formSettings = getSettings()

    // Test
    const { form } = await createForm(page, Form, FormResponseMode.Email, {
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
})
