import mongoose from 'mongoose'
import { BasicField, FormAuthType } from 'shared/types'

import { IFormModel } from 'src/types'

import { allFields, E2eFieldMetadata, sampleField } from './constants/field'
import { test } from './fixtures/auth'
import { createForm } from './utils/createForm'
import { makeModel, makeMongooseFixtures } from './utils/database'
import { getBlankVersion, getOptionalVersion } from './utils/field'
import { getSettings } from './utils/settings'
import { submitForm } from './utils/submitForm'
import { verifySubmission } from './utils/verifySubmission'

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
    // Define form
    const formFields = allFields
    const formSettings = getSettings()

    // Test
    const form = await createForm(page, Form, { formFields, formSettings })
    const responseId = await submitForm(page, {
      form,
      formFields,
      formSettings,
    })
    await verifySubmission(page, { form, formFields, responseId })
  })

  test('Create and submit email mode form with all fields optional', async ({
    page,
  }) => {
    // Define form
    const formFields = allFields.map((ff) =>
      getBlankVersion(getOptionalVersion(ff)),
    )
    const formSettings = getSettings()

    // Test
    const form = await createForm(page, Form, { formFields, formSettings })
    const responseId = await submitForm(page, {
      form,
      formFields,
      formSettings,
    })
    await verifySubmission(page, { form, formFields, responseId })
  })

  test('Create and submit email mode form with identical attachment names', async ({
    page,
  }) => {
    // Define form
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
    const form = await createForm(page, Form, { formFields, formSettings })
    const responseId = await submitForm(page, {
      form,
      formFields,
      formSettings,
    })
    await verifySubmission(page, { form, formFields, responseId })
  })

  test('Create and submit email mode form with optional and required attachments', async ({
    page,
  }) => {
    // Define form
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
    const form = await createForm(page, Form, { formFields, formSettings })
    const responseId = await submitForm(page, {
      form,
      formFields,
      formSettings,
    })
    await verifySubmission(page, { form, formFields, responseId })
  })

  test('Create and submit email mode form with Corppass authentication', async ({
    page,
  }) => {
    // Define form
    const formFields = allFields
    const formSettings = getSettings({
      authType: FormAuthType.CP,
      esrvcId: process.env.CORPPASS_ESRVC_ID,
    })

    // Test
    const form = await createForm(page, Form, { formFields, formSettings })
    const responseId = await submitForm(page, {
      form,
      formFields,
      formSettings,
    })
    await verifySubmission(page, { form, formFields, responseId })
  })
})
