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

// Index of the column headers in the exported CSV. The first 4 rows are
// metadata about the number of responses decrypted.
const CSV_HEADER_ROW_INDEX = 4
// The first two columns are "Reference number" and "Timestamp", so the
// fields to check only start from the third column.
const CSV_ANSWER_COL_INDEX = 2

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

module.exports = {
  verifySubmissionE2e,
  clearDownloadsFolder,
}
