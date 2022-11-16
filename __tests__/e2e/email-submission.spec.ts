import mongoose from 'mongoose'

import { IAgencyModel, IAgencySchema, IFormModel, IUserModel } from 'src/types'

import { allFields } from './constants/field'
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
})
