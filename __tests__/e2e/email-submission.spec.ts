import { Page } from '@playwright/test'
import mongoose from 'mongoose'
import { BasicField, LogicConditionState, LogicType } from 'shared/types'

import { IFormModel } from 'src/types'

import { expect, test } from './fixtures/auth'
import {
  ALL_FIELDS,
  E2eFieldMetadata,
  E2eForm,
  E2eLogic,
  NO_LOGIC,
  SAMPLE_FIELD,
} from './constants'
import { createForm, fillForm, submitForm, verifySubmission } from './helpers'
import {
  deleteDocById,
  getBlankVersion,
  getOptionalVersion,
  getSettings,
  makeModel,
  makeMongooseFixtures,
} from './utils'

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
    await runTest(page, { formFields, formLogics, formSettings })
  })

  test('Create and submit email mode form with all fields optional', async ({
    page,
  }) => {
    // Define
    const formFields = ALL_FIELDS.map((ff) =>
      getBlankVersion(getOptionalVersion(ff)),
    )
    const formLogics = NO_LOGIC
    const formSettings = getSettings()

    // Test
    await runTest(page, { formFields, formLogics, formSettings })
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
    await runTest(page, { formFields, formLogics, formSettings })
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
        ...getBlankVersion(getOptionalVersion(baseField)),
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
    await runTest(page, { formFields, formLogics, formSettings })
  })

  // TODO: Uncomment these tests when mockpass has been fixed.
  // test('Create and submit email mode form with Singpass authentication', async ({
  //   page,
  // }) => {
  //   // Define
  //   const formFields = ALL_FIELDS
  //   const formLogics = NO_LOGIC
  //   const formSettings = getSettings({
  //     authType: FormAuthType.SP,
  //     esrvcId: process.env.SINGPASS_ESRVC_ID,
  //   })

  //   // Test
  //   await runTest(page, { formFields, formLogics, formSettings })
  // })

  // test('Create and submit email mode form with Corppass authentication', async ({
  //   page,
  // }) => {
  //   // Define
  //   const formFields = ALL_FIELDS
  //   const formLogics = NO_LOGIC
  //   const formSettings = getSettings({
  //     authType: FormAuthType.CP,
  //     esrvcId: process.env.CORPPASS_ESRVC_ID,
  //   })

  //   // Test
  //   await runTest(page, { formFields, formLogics, formSettings })
  // })

  // test('Create and submit email mode form with SGID authentication', async ({
  //   page,
  // }) => {
  //   // Define
  //   const formFields = ALL_FIELDS
  //   const formLogics = NO_LOGIC
  //   const formSettings = getSettings({
  //     authType: FormAuthType.SGID,
  //   })

  //   // Test
  //   await runTest(page, { formFields, formLogics, formSettings })
  // })

  // TODO: Add test for MyInfo when mockpass has been fixed.

  test('Create and submit email mode form with all fields shown by logic', async ({
    page,
  }) => {
    // Define
    const formFields: E2eFieldMetadata[] = [
      {
        title: 'Do you want to show the fields?',
        fieldType: BasicField.YesNo,
        val: 'Yes',
      },
      ...ALL_FIELDS,
    ]

    const formLogics: E2eLogic[] = [
      // Single logic block: if "yes", show the fields.
      {
        conditions: [
          {
            field: 0,
            state: LogicConditionState.Equal,
            value: 'Yes',
          },
        ],
        logicType: LogicType.ShowFields,
        show: Array.from(formFields, (_, i) => i).slice(1),
      },
    ]
    const formSettings = getSettings()

    // Test
    await runTest(page, { formFields, formLogics, formSettings })
  })

  test('Create and submit email mode form with a field hidden by logic', async ({
    page,
  }) => {
    // Define
    const formFields: E2eFieldMetadata[] = [
      {
        title: 'Do you want to show the fields?',
        fieldType: BasicField.YesNo,
        val: 'No',
      },
      {
        title: 'This field should be hidden',
        fieldType: BasicField.ShortText,
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
        val: '',
        hidden: true,
      },
    ]
    const formLogics: E2eLogic[] = [
      // Single logic block: if "yes", show the fields.
      {
        conditions: [
          {
            field: 0,
            state: LogicConditionState.Equal,
            value: 'Yes',
          },
        ],
        logicType: LogicType.ShowFields,
        show: Array.from(formFields, (_, i) => i).slice(1),
      },
    ]
    const formSettings = getSettings()

    // Test
    await runTest(page, { formFields, formLogics, formSettings })
  })

  test('Create email mode form with submission disabled by chained logic', async ({
    page,
  }) => {
    const preventSubmitMessage = 'You shall not pass!'

    // Define
    const formFields: E2eFieldMetadata[] = [
      {
        title: 'Enter a number at least 10',
        fieldType: BasicField.Number,
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
        val: '10',
      },
      {
        title: 'Favorite food',
        fieldType: BasicField.Dropdown,
        fieldOptions: ['Rice', 'Chocolate', 'Ice-Cream'],
        val: 'Chocolate',
      },
      {
        title: 'Do you want to submit this form?',
        fieldType: BasicField.YesNo,
        val: 'Yes',
      },
    ]
    const formLogics: E2eLogic[] = [
      {
        conditions: [
          {
            field: 0,
            state: LogicConditionState.Gte,
            value: '10',
          },
        ],
        logicType: LogicType.ShowFields,
        show: [1],
      },
      {
        conditions: [
          {
            field: 1,
            state: LogicConditionState.Either,
            value: ['Rice', 'Chocolate'],
          },
        ],
        logicType: LogicType.ShowFields,
        show: [2],
      },
      {
        conditions: [
          {
            field: 2,
            state: LogicConditionState.Equal,
            value: 'Yes',
          },
        ],
        logicType: LogicType.PreventSubmit,
        message: preventSubmitMessage,
      },
    ]
    const formSettings = getSettings()

    // Test
    const form = await createForm(page, Form, {
      formFields,
      formLogics,
      formSettings,
    })
    await fillForm(page, { form, formFields, formSettings })

    await expect(
      page.locator('button:has-text("Submission disabled")'),
    ).toBeDisabled()
    await expect(page.getByText(preventSubmitMessage)).toBeVisible()

    await deleteDocById(Form, form._id)
  })
})

const runTest = async (page: Page, formDef: E2eForm): Promise<void> => {
  const form = await createForm(page, Form, formDef)
  const responseId = await submitForm(page, {
    form,
    ...formDef,
  })
  await verifySubmission(page, { form, responseId, ...formDef })
  await deleteDocById(Form, form._id)
}
