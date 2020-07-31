const {
  makeMongooseFixtures,
  makeModel,
  deleteDocById,
  createForm,
  makeField,
  getFeatureState,
} = require('../helpers/util')
const { verifySubmissionE2e } = require('../helpers/email-mode')
const { verifiableEmailField } = require('../helpers/verifiable-email-field')
const { cloneDeep } = require('lodash')
const { myInfoFields } = require('../helpers/myinfo-form')

let db
let User
let Form
let Agency
let govTech
const testSpNric = 'S9912374E'
const testCpNric = 'S8979373D'
const testCpUen = '123456789A'
let captchaEnabled
fixture('[Full] Email mode submissions')
  .before(async () => {
    db = await makeMongooseFixtures()
    Agency = makeModel(db, 'agency.server.model', 'Agency')
    User = makeModel(db, 'user.server.model', 'User')
    Form = makeModel(db, 'form.server.model', 'Form')
    govTech = await Agency.findOne({ shortName: 'govtech' }).exec()
    // Check whether captcha is enabled in environment
    captchaEnabled = await getFeatureState('captcha')
  })
  .after(async () => {
    // Delete models defined by mongoose and close connection
    db.models = {}
    await db.close()
  })
  .beforeEach(async (t) => {
    await t.resizeWindow(1280, 800)
  })
  .afterEach(async (t) => {
    await deleteDocById(User, t.ctx.formData.user._id)
    await deleteDocById(Form, t.ctx.form._id)
  })

// For each of the following tests, a public form is created in the DB
// using the fields and options passed to createForm.

// The tests check that a browser is able to navigate to the form start
// page, fill in the form using the values given in formFields.val, submit
// the form and reach the end page.

// Basic form with only one field and SP authentication
test.before(async (t) => {
  const formData = await getDefaultFormOptions({
    authType: 'SP',
    status: 'PRIVATE',
    esrvcId: 'Test-eServiceId-Sp',
  })
  formData.formFields = [
    {
      title: 'short text',
      fieldType: 'textfield',
      val: 'Lorem Ipsum',
    },
  ].map(makeField)
  t.ctx.formData = formData
})('Create and submit basic form with SingPass authentication', async (t) => {
  let authData = { testSpNric }
  t.ctx.form = await createForm(t, t.ctx.formData, Form, captchaEnabled)
  await verifySubmissionE2e(t, t.ctx.form, t.ctx.formData, authData)
})

// Basic form with only one field and CP authentication
test.before(async (t) => {
  const formData = await getDefaultFormOptions({
    authType: 'CP',
    status: 'PRIVATE',
    esrvcId: 'Test-eServiceId-Cp',
  })
  formData.formFields = [
    {
      title: 'short text',
      fieldType: 'textfield',
      val: 'Lorem Ipsum',
    },
  ].map(makeField)
  t.ctx.formData = formData
})('Create and submit basic form with CorpPass authentication', async (t) => {
  let authData = { testCpNric, testCpUen }
  t.ctx.form = await createForm(t, t.ctx.formData, Form, captchaEnabled)
  await verifySubmissionE2e(t, t.ctx.form, t.ctx.formData, authData)
})

// Form with a mix of autofilled and non-autofilled MyInfo fields
test.before(async (t) => {
  const formData = await getDefaultFormOptions({
    authType: 'SP',
    esrvcId: 'Test-eServiceId-Sp',
  })
  formData.formFields = myInfoFields
  t.ctx.formData = formData
})('Create and submit basic MyInfo form', async (t) => {
  let authData = { testSpNric }
  t.ctx.form = await createForm(t, t.ctx.formData, Form, captchaEnabled)
  await verifySubmissionE2e(t, t.ctx.form, t.ctx.formData, authData)
})

test.before(async (t) => {
  const formData = await getDefaultFormOptions()
  formData.formFields = cloneDeep(verifiableEmailField)
  t.ctx.formData = formData
})('Create and submit form with verifiable email field', async (t) => {
  t.ctx.form = await createForm(t, t.ctx.formData, Form, captchaEnabled)
  await verifySubmissionE2e(t, t.ctx.form, t.ctx.formData)
})

// Creates an object with default form options, with optional modifications.
const getDefaultFormOptions = async ({
  title = 'Submission e2e Form',
  authType = 'NIL',
  status = 'PUBLIC',
  esrvcId = '',
} = {}) => {
  title += String(Date.now())
  const user = await User.create({
    email: String(Date.now()) + '@data.gov.sg',
    agency: govTech._id,
  })
  return {
    user,
    formOptions: {
      responseMode: 'email',
      hasCaptcha: false,
      status,
      title,
      authType,
      esrvcId,
    },
  }
}
