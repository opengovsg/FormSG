const { adminTabs, dataTab } = require('./selectors')

const {
  expectStartPage,
  fillInForm,
  submitForm,
  expectEndPage,
  appUrl,
  getResponseArray,
  getResponseTitle,
  expectContains,
  expectSpcpLogin,
  getAuthFields,
  getDownloadsFolder,
} = require('./util')

const fs = require('fs')
const rimraf = require('rimraf')
const parse = require('csv-parse/lib/sync')
const ngrok = require('ngrok')

// Index of the column headers in the exported CSV. The first 4 rows are
// metadata about the number of responses decrypted.
const CSV_HEADER_ROW_INDEX = 5
// The first two columns are "Response ID" and "Timestamp", so the
// fields to check only start from the third column.
const CSV_ANSWER_COL_INDEX = 3

const WEBHOOK_PORT = process.env.MOCK_WEBHOOK_PORT
const WEBHOOK_CONFIG_FILE = process.env.MOCK_WEBHOOK_CONFIG_FILE

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

const addExpectedCsvResponse = (field, headers, answers) => {
  addExpectedCsvTitle(field, headers)
  addExpectedCsvAnswer(field, answers)
}

const emptyCallback = () => {}

const clearDownloadsFolder = (formTile, formId) => {
  const downloadsFolder = getDownloadsFolder()
  rimraf(
    `${downloadsFolder}/Form Secret Key - ${formTile}.txt`,
    {
      glob: false,
    },
    emptyCallback,
  )
  rimraf(
    `${downloadsFolder}/${formTile}-${formId}.csv`,
    {
      glob: false,
    },
    emptyCallback,
  )
}

const createWebhookConfig = async (formTitle) => {
  const encodedTitle = encodeURI(formTitle)
  const webhookUrl = await ngrok.connect(WEBHOOK_PORT)
  const downloadsFolder = getDownloadsFolder()
  fs.writeFileSync(
    `${downloadsFolder}/${WEBHOOK_CONFIG_FILE}`,
    `${encodedTitle},${webhookUrl}`,
    'utf8',
  )
  return webhookUrl
}

const removeWebhookConfig = async (url) => {
  await ngrok.disconnect(url)
  const downloadsFolder = getDownloadsFolder()
  rimraf(
    `${downloadsFolder}/${WEBHOOK_CONFIG_FILE}`,
    {
      glob: false,
    },
    emptyCallback,
  )
}

// Download the CSV and verify its contents
async function checkDownloadCsv(t, formData, authData, formId) {
  let { formFields, formOptions } = formData
  formFields = formFields.concat(getAuthFields(formOptions.authType, authData))
  await t.click(dataTab.exportBtn)
  await t.click(dataTab.exportBtnDropdownResponses)
  await t.wait(2000)
  const csvContent = await fs.promises.readFile(
    `${getDownloadsFolder()}/${formOptions.title}-${formId}.csv`,
  )
  const records = parse(csvContent, { relax_column_count: true })
  const headers = ['Response ID', 'Timestamp', 'Download Status']
  const answers = []
  formFields.forEach((field) => addExpectedCsvResponse(field, headers, answers))
  await t.expect(records[CSV_HEADER_ROW_INDEX]).eql(headers)
  const actualAnswers =
    records[CSV_HEADER_ROW_INDEX + 1].slice(CSV_ANSWER_COL_INDEX)
  await t.expect(actualAnswers).eql(answers)
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

const verifyWebhookSubmission = async (t, formData, webhookRequestData) => {
  let { formFields } = formData
  for (let i = 0; i < formFields.length; i++) {
    await t
      .expect(formFields[i].title)
      .eql(webhookRequestData.responses[i].question)
    await t
      .expect(formFields[i].fieldType)
      .eql(webhookRequestData.responses[i].fieldType)
    await t
      .expect(formFields[i].val)
      .eql(webhookRequestData.responses[i].answer)
  }
}

module.exports = {
  verifySubmissionE2e,
  clearDownloadsFolder,
  verifyWebhookSubmission,
  createWebhookConfig,
  removeWebhookConfig,
}
