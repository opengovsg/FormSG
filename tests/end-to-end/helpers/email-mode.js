const {
  getSubmission,
  expectStartPage,
  fillInForm,
  submitForm,
  expectEndPage,
  appUrl,
  getSubstringBetween,
  decodeHtmlEntities,
  expectContains,
  getResponseArray,
  getResponseTitle,
  expectSpcpLogin,
  getAuthFields,
  tableHandler,
} = require('./util')

/**
 * Gets answers for a field as displayed in response email's Data Collation
 * Tool section. Always returns an array, so caller must always loop through result.
 * @param {Object} field Field as created by makeField
 * @param {string} formMode 'email' or 'encrypt'
 */
const getExpectedJSONArray = (field, formMode) => {
  // Deal with table first to avoid special cases later
  if (field.fieldType === 'table') {
    return tableHandler.getValues(field, formMode)
  }
  // Only allow blanks if field is not visible or optional
  if (!field.isVisible || (!field.required && field.isLeftBlank)) {
    return ['']
  }
  switch (field.fieldType) {
    case 'checkbox':
      return [
        `'${field.val
          .map((selected) => {
            return field.fieldOptions.includes(selected)
              ? selected
              : `Others: ${selected}`
          })
          .join(', ')}`,
      ]
    case 'radiobutton':
      return [
        field.fieldOptions.includes(field.val)
          ? isNaN(Number(field.val))
            ? `'${field.val}`
            : field.val
          : `'Others: ${field.val}`,
      ]
    default:
      return [
        field.val instanceof Array
          ? `'${field.val.join(', ')}`
          : isNaN(Number(field.val))
          ? `'${String(field.val)}`
          : String(field.val),
      ]
  }
}
// Checks that an attachment field's attachment is contained in the email.
const expectAttachment = async (t, field, attachments) => {
  // Attachments can only be in fields that are visible AND either required
  // or optional but filled
  if (field.isVisible && (field.required || !field.isLeftBlank)) {
    const attachment = attachments.find((att) => att.fileName === field.val)
    // Check that attachment exists
    await t.expect(attachment).ok()
    // Check that contents match
    await t.expect(attachment.content).eql(field.content)
  }
}

// Grab submission email and verify its contents
const verifySubmission = async (t, testFormData, authData) => {
  let { user, formFields, formOptions } = testFormData
  const authType = formOptions ? formOptions.authType : 'NIL'
  // Add verified authentication data (NRIC/UEN/UID) at the end
  formFields = formFields.concat(getAuthFields(authType, authData))
  formFields = formFields.filter((f) => f.fieldType !== 'section')

  const title = formOptions ? formOptions.title : ''
  const { html, subject, to, from, attachments } = await getSubmission(title)
  // Verify recipient of email
  await t.expect(to).eql(user.email)

  // Verify sender of email
  await t.expect(from).eql('FormSG <donotreply@mail.form.gov.sg>')

  // Verify subject of email
  await t.expect(subject).contains(`formsg-auto: ${title} (#`)
  // Verify form content in email
  for (let field of formFields) {
    const contained = [
      getResponseTitle(field, false, 'email'),
      ...getResponseArray(field, 'email'),
    ]
    await expectContains(t, html, contained)
    if (field.fieldType === 'attachment') {
      await expectAttachment(t, field, attachments)
    }
  }

  // Verify JSON for data collation
  const emailJSONStr = getSubstringBetween(
    html,
    '<p>-- Start of JSON --</p>',
    '<p>-- End of JSON --</p>',
  )
  await t.expect(emailJSONStr).notEql(null)
  const emailJSON = JSON.parse(decodeHtmlEntities(emailJSONStr))
  const response = emailJSON.filter(
    ({ question }) => !/(Response ID|Timestamp)/.test(question),
  )
  await t.expect(response.length).notEql(0)
  let rowIdx = 0 // A table could result in multiple rows of answers, so there might be more answers than form fields
  for (let field of formFields) {
    await t
      .expect(response[rowIdx].question)
      .eql(getResponseTitle(field, true, 'email'))
    for (let expectedAnswer of getExpectedJSONArray(
      field,
      'emailDataCollation',
    )) {
      await t.expect(response[rowIdx].answer).eql(expectedAnswer)
      rowIdx++
    }
  }
}

// Open form, fill it in, submit and verify submission
const verifySubmissionE2e = async (t, form, formData, authData) => {
  // Verify that form can be accessed
  await expectStartPage(t, form, formData, appUrl)
  if (authData) {
    await expectSpcpLogin(t, formData.formOptions.authType, authData)
  }
  // Fill in form=
  await fillInForm(t, form, formData)
  await submitForm(t)
  // Verify that end page is shown
  await expectEndPage(t)
  // Verify that submission is as expected
  await verifySubmission(t, formData, authData)
}

module.exports = {
  verifySubmissionE2e,
}
