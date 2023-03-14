import { Page } from '@playwright/test'
import mongoose from 'mongoose'
import { BasicField, FormResponseMode } from 'shared/types'

import { IFormModel } from 'src/types'

import { test } from './fixtures/auth'
import { ALL_FIELDS as _ALL_FIELDS, E2eForm, NO_LOGIC } from './constants'
import { createForm, submitForm, verifySubmission } from './helpers'
import {
  deleteDocById,
  getSettings,
  makeModel,
  makeMongooseFixtures,
} from './utils'

// TODO: Attachment fields don't work on storage mode unless we spin up localstack.
const ALL_FIELDS = _ALL_FIELDS.filter(
  (field) => field.fieldType !== BasicField.Attachment,
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
    db.models = {}
    await db.close()
  })

  test('Create and submit storage mode form with all fields', async ({
    page,
  }) => {
    // Define
    const formFields = ALL_FIELDS
    const formLogics = NO_LOGIC
    const formSettings = getSettings()

    // Test
    await runTest(page, { formFields, formLogics, formSettings })
  })
})

const runTest = async (page: Page, formDef: E2eForm): Promise<void> => {
  const { form, formResponseMode } = await createForm(
    page,
    Form,
    FormResponseMode.Encrypt,
    formDef,
  )
  const responseId = await submitForm(page, {
    form,
    ...formDef,
  })
  await verifySubmission(page, {
    form,
    formResponseMode,
    responseId,
    ...formDef,
  })
  await deleteDocById(Form, form._id)
}
