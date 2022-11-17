import { Page } from '@playwright/test'
import mongoose from 'mongoose'
import { BasicField, FormAuthType } from 'shared/types'

import { IFormModel } from 'src/types'

import { allFields, E2eFieldMetadata, sampleField } from './constants/field'
import { E2eForm } from './constants/form'
import { test } from './fixtures/auth'
import { createForm } from './helpers/createForm'
import { submitForm } from './helpers/submitForm'
import { verifySubmission } from './helpers/verifySubmission'
import {
  deleteDocById,
  makeModel,
  makeMongooseFixtures,
} from './utils/database'
import { getBlankVersion, getOptionalVersion } from './utils/field'
import { getSettings } from './utils/settings'

let db: mongoose.Connection
//let User: IUserModel
let Form: IFormModel
//let Agency: IAgencyModel
//let govTech: IAgencySchema | null

test.describe('Email form submission', () => {
  test.beforeAll(async () => {
    // Create models
    db = await makeMongooseFixtures()
    //Agency = makeModel(db, 'agency.server.model', 'Agency')
    //User = makeModel(db, 'user.server.model', 'User')
    Form = makeModel(db, 'form.server.model', 'Form')
    //govTech = await Agency.findOne({ shortName: 'govtech' }).exec()
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
    const formFields = allFields
    const formSettings = getSettings()

    // Test
    await runTest(page, { formFields, formSettings })
  })

  test('Create and submit email mode form with all fields optional', async ({
    page,
  }) => {
    // Define
    const formFields = allFields.map((ff) =>
      getBlankVersion(getOptionalVersion(ff)),
    )
    const formSettings = getSettings()

    // Test
    await runTest(page, { formFields, formSettings })
  })

  test('Create and submit email mode form with identical attachment names', async ({
    page,
  }) => {
    // Define
    const baseField = sampleField[BasicField.Attachment]
    const formFields = new Array(3).fill('').map(
      (_, i) =>
        ({
          ...baseField,
          title: `Attachment ${i}`,
          path: `__tests__/e2e/files/att-folder-${i}/test-att.txt`,
          val: `${i === 2 ? '' : `${2 - i}-`}test-att.txt`,
        } as E2eFieldMetadata),
    )
    const formSettings = getSettings()

    // Test
    await runTest(page, { formFields, formSettings })
  })

  test('Create and submit email mode form with optional and required attachments', async ({
    page,
  }) => {
    // Define
    const baseField = sampleField[BasicField.Attachment]
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
    const formSettings = getSettings()

    // Test
    await runTest(page, { formFields, formSettings })
  })

  test('Create and submit email mode form with Singpass authentication', async ({
    page,
  }) => {
    // Define
    const formFields = allFields
    const formSettings = getSettings({
      authType: FormAuthType.SP,
      esrvcId: process.env.SINGPASS_ESRVC_ID,
    })

    // Test
    await runTest(page, { formFields, formSettings })
  })

  test('Create and submit email mode form with Corppass authentication', async ({
    page,
  }) => {
    // Define
    const formFields = allFields
    const formSettings = getSettings({
      authType: FormAuthType.CP,
      esrvcId: process.env.CORPPASS_ESRVC_ID,
    })

    // Test
    await runTest(page, { formFields, formSettings })
  })
})

const runTest = async (
  page: Page,
  { formFields, formSettings }: E2eForm,
): Promise<void> => {
  const form = await createForm(page, Form, { formFields, formSettings })
  const responseId = await submitForm(page, {
    form,
    formFields,
    formSettings,
  })
  await verifySubmission(page, { form, formFields, responseId })
  await deleteDocById(Form, form._id)
}
