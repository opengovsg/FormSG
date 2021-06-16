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
} = require('./util')

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
    ({ question }) => !/(Reference Number|Timestamp)/.test(question),
  )
  await t.expect(response.length).notEql(0)
  let rowIdx = 0 // A table could result in multiple rows of answers, so there might be more answers than form fields
  for (let field of formFields) {
    await t
      .expect(response[rowIdx].question)
      .eql(getResponseTitle(field, true, 'email'))
    for (let expectedAnswer of getResponseArray(field, 'email')) {
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
