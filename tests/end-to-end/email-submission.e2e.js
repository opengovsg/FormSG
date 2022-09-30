const {
  makeMongooseFixtures,
  makeModel,
  deleteDocById,
  createFormFromTemplate,
  createForm,
  getOptionalVersion,
  getBlankVersion,
  verifySubmissionDisabled,
  getFeatureState,
} = require('./helpers/util')

const { verifySubmissionE2e } = require('./helpers/email-mode')
const { verifiableEmailField } = require('./helpers/verifiable-email-field')
const { allFields } = require('./helpers/all-fields')
const { templateFields } = require('./helpers/template-fields')
const {
  hiddenFieldsData,
  hiddenFieldsLogicData,
} = require('./helpers/all-hidden-form')
const { tripleAttachment } = require('./helpers/triple-attachment')
const chainDisabled = require('./helpers/disabled-form-chained')

const { cloneDeep } = require('lodash')
const { myInfoFields } = require('./helpers/myinfo-form')

let db
let User
let Form
let Agency
let govTech
const testSpNric = 'S9912374E' // Used for myinfo
let captchaEnabled
fixture('Email mode submissions')
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

// Form with all basic field types
test.before(async (t) => {
  const formData = await getDefaultFormOptions()
  formData.formFields = cloneDeep(allFields)
  t.ctx.formData = formData
})('Create and submit form with all form fields', async (t) => {
  t.ctx.form = await createForm(t, t.ctx.formData, Form, captchaEnabled)
  await verifySubmissionE2e(t, t.ctx.form, t.ctx.formData)
})

// Form where all basic field types are hidden by logic
test.before(async (t) => {
  const formData = await getDefaultFormOptions()
  formData.formFields = cloneDeep(hiddenFieldsData)
  formData.logicData = cloneDeep(hiddenFieldsLogicData)
  t.ctx.formData = formData
})('Create and submit form with all field types hidden', async (t) => {
  t.ctx.form = await createForm(t, t.ctx.formData, Form, captchaEnabled)
  await verifySubmissionE2e(t, t.ctx.form, t.ctx.formData)
})

// Form where all fields are optional and no field is answered
test.before(async (t) => {
  const formData = await getDefaultFormOptions()
  formData.formFields = allFields.map((field) => {
    return getBlankVersion(getOptionalVersion(field))
  })
  t.ctx.formData = formData
})('Create and submit form with all field types optional', async (t) => {
  t.ctx.form = await createForm(t, t.ctx.formData, Form, captchaEnabled)
  await verifySubmissionE2e(t, t.ctx.form, t.ctx.formData)
})

// Form with three attachments to test de-duplication of attachment names
test.before(async (t) => {
  const formData = await getDefaultFormOptions()
  formData.formFields = cloneDeep(tripleAttachment)
  t.ctx.formData = formData
})('Create and submit form with identical attachment names', async (t) => {
  t.ctx.form = await createForm(t, t.ctx.formData, Form, captchaEnabled)
  await verifySubmissionE2e(t, t.ctx.form, t.ctx.formData)
})

// Form with optional attachment in between mandatory ones
test.before(async (t) => {
  const formData = await getDefaultFormOptions()
  formData.formFields = cloneDeep(tripleAttachment)
  // Modify middle attachment field to be optional and unfilled
  formData.formFields[1] = getBlankVersion(
    getOptionalVersion(formData.formFields[1]),
  )
  // Modify first filename to account for middle field left blank
  formData.formFields[0].val = '1-test-att.txt'
  t.ctx.formData = formData
})(
  'Create and submit form with optional and required attachments',
  async (t) => {
    t.ctx.form = await createForm(t, t.ctx.formData, Form, captchaEnabled)
    await verifySubmissionE2e(t, t.ctx.form, t.ctx.formData)
  },
)

// Form where submission is prevented using chained logic
test.before(async (t) => {
  const formData = await getDefaultFormOptions()
  formData.formFields = cloneDeep(chainDisabled.fields)
  formData.logicData = cloneDeep(chainDisabled.logicData)
  t.ctx.formData = formData
})('Create and disable form with chained logic', async (t) => {
  t.ctx.form = await createForm(t, t.ctx.formData, Form, captchaEnabled)
  await verifySubmissionDisabled(
    t,
    t.ctx.form,
    t.ctx.formData,
    chainDisabled.toastMessage,
  )
})

test.before(async (t) => {
  const formData = await getDefaultFormOptions()
  t.ctx.formData = formData
  // cloneDeep in case other tests in future import and modify templateFields
  t.ctx.formData.formFields = cloneDeep(templateFields)
})('Create a form from COVID19 Templates', async (t) => {
  t.ctx.form = await createFormFromTemplate(
    t,
    t.ctx.formData,
    Form,
    captchaEnabled,
  )
  t.ctx.endPageTitle = 'Thank you for registering your interest.'
  await verifySubmissionE2e(t, t.ctx.form, t.ctx.formData)
})

// Form with a mix of autofilled and non-autofilled MyInfo fields
test.before(async (t) => {
  const formData = await getDefaultFormOptions({
    authType: 'MyInfo',
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
    contact: '+6587654321',
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
