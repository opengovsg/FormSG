import mongoose from 'mongoose'
import { BasicField } from 'shared/types'

import { IAgencyModel, IAgencySchema, IFormModel, IUserModel } from 'src/types'

import { allFields, E2eFieldMetadata, sampleField } from './constants/field'
import { test } from './fixtures/auth'
import { createForm } from './utils/createForm'
import { makeModel, makeMongooseFixtures } from './utils/database'
import { getBlankVersion, getOptionalVersion } from './utils/field'
import { submitForm } from './utils/submitForm'
import { verifySubmission } from './utils/verifySubmission'

let db: mongoose.Connection
let User: IUserModel
let Form: IFormModel
let Agency: IAgencyModel
let govTech: IAgencySchema | null

test.describe('Email form submission', () => {
  test.beforeAll(async () => {
    // Create models
    db = await makeMongooseFixtures()
    Agency = makeModel(db, 'agency.server.model', 'Agency')
    User = makeModel(db, 'user.server.model', 'User')
    Form = makeModel(db, 'form.server.model', 'Form')
    govTech = await Agency.findOne({ shortName: 'govtech' }).exec()
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
    const fieldMetas = allFields

    // Test
    const form = await createForm(page, Form, { fieldMetas })
    const responseId = await submitForm(page, { form, fieldMetas })
    await verifySubmission(page, { form, fieldMetas, responseId })
  })

  test('Create and submit email mode form with all fields optional', async ({
    page,
  }) => {
    // Define form
    const fieldMetas = allFields.map((ff) =>
      getBlankVersion(getOptionalVersion(ff)),
    )

    // Test
    const form = await createForm(page, Form, { fieldMetas })
    const responseId = await submitForm(page, { form, fieldMetas })
    await verifySubmission(page, { form, fieldMetas, responseId })
  })

  test('Create and submit email mode form with identical attachment names', async ({
    page,
  }) => {
    // Define form
    const baseField = sampleField[BasicField.Attachment]
    const fieldMetas = new Array(3).fill('').map(
      (_, i) =>
        ({
          ...baseField,
          title: `Attachment ${i}`,
          path: `__tests__/e2e/files/att-folder-${i}/test-att.txt`,
          val: `${i === 2 ? '' : `${2 - i}-`}test-att.txt`,
        } as E2eFieldMetadata),
    )

    // Test
    const form = await createForm(page, Form, { fieldMetas })
    const responseId = await submitForm(page, { form, fieldMetas })
    await verifySubmission(page, { form, fieldMetas, responseId })
  })

  test('Create and submit email mode form with optional and required attachments', async ({
    page,
  }) => {
    // Define form
    const baseField = sampleField[BasicField.Attachment]
    const fieldMetas = [
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

    // Test
    const form = await createForm(page, Form, { fieldMetas })
    const responseId = await submitForm(page, { form, fieldMetas })
    await verifySubmission(page, { form, fieldMetas, responseId })
  })
})
