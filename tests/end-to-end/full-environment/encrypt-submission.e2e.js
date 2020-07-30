const {
  makeMongooseFixtures,
  makeModel,
  deleteDocById,
  createForm,
  makeField,
} = require('../helpers/util')
const {
  verifySubmissionE2e,
  clearDownloadsFolder,
} = require('../helpers/encrypt-mode')
const { verifiableEmailField } = require('../helpers/verifiable-email-field')
const { cloneDeep } = require('lodash')

let User
let Form
let Agency
let govTech
let db
const testSpNric = 'S6005038D'
const testCpNric = 'S8979373D'
const testCpUen = '123456789A'

fixture('[Full] Storage mode submissions')
  .before(async () => {
    db = await makeMongooseFixtures()
    Agency = makeModel(db, 'agency.server.model', 'Agency')
    User = makeModel(db, 'user.server.model', 'User')
    Form = makeModel(db, 'form.server.model', 'Form')
    govTech = await Agency.findOne({ shortName: 'govtech' }).exec()
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
    // Clear used files
    clearDownloadsFolder(t.ctx.form.title, t.ctx.form._id)
  })

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
  t.ctx.form = await createForm(t, t.ctx.formData, Form)
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
  t.ctx.form = await createForm(t, t.ctx.formData, Form)
  await verifySubmissionE2e(t, t.ctx.form, t.ctx.formData, authData)
})

test.before(async (t) => {
  const formData = await getDefaultFormOptions()
  formData.formFields = cloneDeep(verifiableEmailField)
  t.ctx.formData = formData
})('Create and submit form with verifiable email field', async (t) => {
  t.ctx.form = await createForm(t, t.ctx.formData, Form)
  await verifySubmissionE2e(t, t.ctx.form, t.ctx.formData)
})

// Creates an object with default encrypt-mode form options, with optional modifications.
// Note that a new user needs to be created for each test, otherwise the extractOTP function
// may get the wrong OTP due to a concurrency issue where it grabs the wrong email from the
// user inbox.
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
      responseMode: 'encrypt',
      hasCaptcha: false,
      status,
      title,
      authType,
      esrvcId,
    },
  }
}
