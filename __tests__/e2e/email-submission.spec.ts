import mongoose from 'mongoose'

import { IAgencyModel, IAgencySchema, IFormModel, IUserModel } from 'src/types'

import { allFields } from './constants/field'
import { test as authtest } from './fixtures/auth'
import { createForm } from './utils/createForm'
import { makeModel, makeMongooseFixtures } from './utils/database'
import { submitForm } from './utils/submitForm'
import { verifySubmission } from './utils/verifySubmission'

let db: mongoose.Connection
let User: IUserModel
let Form: IFormModel
let Agency: IAgencyModel
let govTech: IAgencySchema | null
const test = authtest.extend({
  page: async ({ page }, use) => {
    // Create models
    db = await makeMongooseFixtures()
    Agency = makeModel(db, 'agency.server.model', 'Agency')
    User = makeModel(db, 'user.server.model', 'User')
    Form = makeModel(db, 'form.server.model', 'Form')
    govTech = await Agency.findOne({ shortName: 'govtech' }).exec()

    // Run test
    await use(page)

    // Clean up db
    db.models = {}
    await db.close()
  },
})

test.describe('Email form submission', () => {
  test('Create and submit email mode form with all fields', async ({
    page,
  }) => {
    const fieldMetas = allFields

    const form = await createForm(page, Form, { fieldMetas })
    const responseId = await submitForm(page, { form, fieldMetas })
    await verifySubmission(page, { form, fieldMetas, responseId })
  })
})
