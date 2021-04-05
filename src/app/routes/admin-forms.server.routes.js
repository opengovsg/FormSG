'use strict'

/**
 * Module dependencies.
 */

const EmailSubmissionsMiddleware = require('../../app/modules/submission/email-submission/email-submission.middleware')
const AdminFormController = require('../modules/form/admin-form/admin-form.controller')
const { withUserAuthentication } = require('../modules/auth/auth.middlewares')

module.exports = function (app) {
  /**
   * On preview, submit a form response, processing it as an email to be sent to
   * the public servant who created the form. Optionally, email a PDF
   * containing the submission back to the user, if an email address
   * was given. SMS autoreplies for mobile number fields are also sent if feature
   * is enabled.
   * Note that preview submissions are not saved to db
   * Note that spcp session is not verified, neither is myInfo data verified
   * @route POST /v2/submissions/email/preview/{formId}
   * @group forms - endpoints to serve forms
   * @param {string} formId.path.required - the form id
   * @param {Array} response.body.required - contains the entire form submission
   * @consumes multipart/form-data
   * @produces application/json
   * @returns {SubmissionResponse.model} 200 - submission made
   * @returns {SubmissionResponse.model} 400 - submission has bad data and could not be processed
   * @security OTP
   */
  app
    .route('/v2/submissions/email/preview/:formId([a-fA-F0-9]{24})')
    .post(
      withUserAuthentication,
      EmailSubmissionsMiddleware.receiveEmailSubmission,
      EmailSubmissionsMiddleware.validateResponseParams,
      AdminFormController.handleEmailPreviewSubmission,
    )
}
