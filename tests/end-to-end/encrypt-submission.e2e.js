const { adminTabs, dataTab } = require('./helpers/selectors')

const {
  makeMongooseFixtures,
  makeModel,
  deleteDocById,
  createForm,
  expectStartPage,
  fillInForm,
  submitForm,
  expectEndPage,
  appUrl,
  getResponseArray,
  getResponseTitle,
  expectContains,
  makeField,
  getOptionalVersion,
  getBlankVersion,
  expectSpcpLogin,
  getAuthFields,
  verifySubmissionDisabled,
  getDownloadsFolder,
} = require('./helpers/util')
const { allFields } = require('./helpers/all-fields')
const {
  hiddenFieldsData,
  hiddenFieldsLogicData,
} = require('./helpers/all-hidden-form')
const chainDisabled = require('./helpers/disabled-form-chained')

const { cloneDeep } = require('lodash')
const aws = require('aws-sdk')
const fs = require('fs')
const parse = require('csv-parse/lib/sync')
const rimraf = require('rimraf')

let User
let Form
let Agency
let govTech
let db
const testSpNric = 'S6005038D'
const testCpNric = 'S8979373D'
const testCpUen = '123456789A'
// Index of the column headers in the exported CSV. The first 4 rows are
// metadata about the number of responses decrypted.
const CSV_HEADER_ROW_INDEX = 4
// The first two columns are "Reference number" and "Timestamp", so the
// fields to check only start from the third column.
const CSV_ANSWER_COL_INDEX = 2
const emptyCallback = () => {}

fixture('Storage mode submissions')
  .before(async () => {
    db = await makeMongooseFixtures()
    Agency = makeModel(db, 'agency.server.model', 'Agency')
    User = makeModel(db, 'user.server.model', 'User')
    Form = makeModel(db, 'form.server.model', 'Form')
    govTech = await Agency.findOne({ shortName: 'govtech' }).exec()

    // Create s3 bucket for attachments
    const s3 = new aws.S3({
      endpoint: process.env.FORMSG_LOCALSTACK_ENDPT,
      s3ForcePathStyle: true,
    })
    await s3
      .createBucket({ Bucket: process.env.ATTACHMENT_S3_BUCKET })
      .promise()
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
    const downloadsFolder = getDownloadsFolder()
    rimraf(
      `${downloadsFolder}/Form Secret Key - ${t.ctx.form.title}.txt`,
      {
        glob: false,
      },
      emptyCallback,
    )
    rimraf(
      `${downloadsFolder}/${t.ctx.form.title}-${t.ctx.form._id}.csv`,
      {
        glob: false,
      },
      emptyCallback,
    )
  })

// Form with all field types available in storage mode
test.before(async (t) => {
  const formData = await getDefaultFormOptions()
  formData.formFields = cloneDeep(allFields)
  t.ctx.formData = formData
})('Create and submit form with all field types', async (t) => {
  t.ctx.form = await createForm(t, t.ctx.formData, Form)
  await verifySubmissionE2e(t, t.ctx.form, t.ctx.formData)
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

// Form where all basic field types are hidden by logic
test.before(async (t) => {
  const formData = await getDefaultFormOptions()
  formData.formFields = cloneDeep(hiddenFieldsData)
  formData.logicData = cloneDeep(hiddenFieldsLogicData)
  t.ctx.formData = formData
})('Create and submit form with all field types hidden', async (t) => {
  t.ctx.form = await createForm(t, t.ctx.formData, Form)
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
  t.ctx.form = await createForm(t, t.ctx.formData, Form)
  await verifySubmissionE2e(t, t.ctx.form, t.ctx.formData)
})

// Form where submission is prevented using chained logic
test.before(async (t) => {
  const formData = await getDefaultFormOptions()
  formData.formFields = cloneDeep(chainDisabled.fields)
  formData.logicData = cloneDeep(chainDisabled.logicData)
  t.ctx.formData = formData
})('Create and disable form with chained logic', async (t) => {
  t.ctx.form = await createForm(t, t.ctx.formData, Form)
  await verifySubmissionDisabled(
    t,
    t.ctx.form,
    t.ctx.formData,
    chainDisabled.toastMessage,
  )
})

// Open form, fill it in, submit, then log in and verify response
// in data tab
const verifySubmissionE2e = async (t, form, formData, authData) => {
  // Going to the form, filling it in and submitting
  await expectStartPage(t, form, formData, appUrl)
  if (authData) {
    await expectSpcpLogin(t, formData.formOptions.authType, authData)
  }
  await fillInForm(t, form, formData)
  await submitForm(t)
  await expectEndPage(t)

  // Ensuring that submission is decrypted and values are correct
  // No need to log in again as signin was already done to create form
  const { _id } = form
  await navigateToResults(t, _id)
  await enterSecretKey(t, formData.formOptions.secretKey)
  await checkDownloadCsv(t, formData, authData, _id)
  await clickResponseRow(t, 0)
  await checkDecryptedResponses(t, formData, authData)
}

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

// Navigate to the results tab
async function navigateToResults(t, id) {
  await t.navigateTo(`${appUrl}/#!/${id}/admin`).click(adminTabs.data)
}

// Type in the secretKey
async function enterSecretKey(t, secretKey) {
  await t
    .typeText(dataTab.secretKeyInput, secretKey, { paste: true })
    .click(dataTab.unlockResponsesBtn)
}

// Checking if the decrypted response is correct
async function checkDecryptedResponses(t, formData, authData) {
  let { formFields, formOptions } = formData
  formFields = formFields.concat(getAuthFields(formOptions.authType, authData))
  for (let i = 0; i < formFields.length; i++) {
    const field = formFields[i]
    await t
      .expect(dataTab.getNthFieldTitle(i).textContent)
      .contains(getResponseTitle(field, false, 'encrypt'))
    if (field.fieldType === 'table') {
      await checkTableResponse(t, field, i)
    } else {
      await expectContains(
        t,
        dataTab.getNthFieldAnswer(i).textContent,
        getResponseArray(field, 'encrypt'),
      )
    }
    if (
      field.fieldType === 'attachment' &&
      field.isVisible &&
      !field.isLeftBlank
    ) {
      await checkAttachmentContent(t, field, i)
    }
  }
}

// Check that a table response in the responses view is correct
async function checkTableResponse(t, field, index) {
  for (let i = 0; i < field.val.length; i++) {
    const row = field.val[i]
    for (let j = 0; j < row.length; j++) {
      await t
        .expect(dataTab.getNthFieldTableCell(index, i, j).value)
        .eql(row[j])
    }
  }
}

// Download file and check that its contents are correct
async function checkAttachmentContent(t, field, fieldIndex) {
  await t.click(dataTab.getNthFieldDownloadLink(fieldIndex))
  const filePath = `${getDownloadsFolder()}/${field.val}`
  const fileContent = await fs.promises.readFile(filePath, 'ascii')
  await t.expect(fileContent).eql(field.content)
  rimraf(filePath, { glob: false }, emptyCallback)
}

// Click on the given row
async function clickResponseRow(t, index) {
  await t.click(dataTab.getNthSubmission(index))
}

// Download the CSV and verify its contents
async function checkDownloadCsv(t, formData, authData, formId) {
  let { formFields, formOptions } = formData
  formFields = formFields.concat(getAuthFields(formOptions.authType, authData))
  await t.click(dataTab.exportBtn)
  await t.wait(2000)
  const csvContent = await fs.promises.readFile(
    `${getDownloadsFolder()}/${formOptions.title}-${formId}.csv`,
  )
  const records = parse(csvContent, { relax_column_count: true })
  const headers = ['Reference number', 'Timestamp']
  const answers = []
  formFields.forEach((field) => addExpectedCsvResponse(field, headers, answers))
  await t.expect(records[CSV_HEADER_ROW_INDEX]).eql(headers)
  const actualAnswers = records[CSV_HEADER_ROW_INDEX + 1].slice(
    CSV_ANSWER_COL_INDEX,
  )
  await t.expect(actualAnswers).eql(answers)
}

const addExpectedCsvResponse = (field, headers, answers) => {
  addExpectedCsvTitle(field, headers)
  addExpectedCsvAnswer(field, answers)
}

// We can't just call getResponseArray because CSVs use different
// delimiters for checkbox and table. Hence we treat checbox and table
// specially, and call getResponseArray for the rest.
const addExpectedCsvAnswer = (field, answers) => {
  const numCols = field.fieldType === 'table' ? field.val.length : 1
  switch (field.fieldType) {
    case 'table':
      for (let i = 0; i < numCols; i++) {
        answers.push(field.val[i].join(';'))
      }
      break
    case 'checkbox':
      if (!field.isVisible || field.isLeftBlank) {
        answers.push('')
      } else {
        answers.push(
          field.val
            .map((selected) => {
              return field.fieldOptions.includes(selected)
                ? selected
                : `Others: ${selected}`
            })
            .join(';'),
        )
      }
      break
    default:
      answers.push(...getResponseArray(field))
  }
}

// We can't just call getResponseTitle because the prefixes are different
// for verifiable fields in CSVs, and the number of repetitions of the title
// depends on the number of rows in the answer for table fields.
const addExpectedCsvTitle = (field, headers) => {
  let responseTitle = getResponseTitle(field, false, 'encrypt')
  const numCols = field.fieldType === 'table' ? field.val.length : 1
  for (let i = 0; i < numCols; i++) {
    headers.push(responseTitle)
  }
}
