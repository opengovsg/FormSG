'use strict'

const { StatusCodes } = require('http-status-codes')
const { createReqMeta } = require('../utils/request')
const logger = require('../../config/logger').createLoggerWithLabel(module)
const MailService = require('../services/mail/mail.service').default

/**
 * @param {Error} err - the Error to report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} submission - the Mongoose model instance
 * of the submission
 */
function onSubmissionEmailFailure(err, req, res, submission) {
  logger.error({
    message: 'Error submitting email form',
    meta: {
      action: 'onSubmissionEmailFailure',
      ...createReqMeta(req),
    },
    error: err,
  })
  return res.status(StatusCodes.BAD_REQUEST).json({
    message:
      'Could not send submission. For assistance, please contact the person who asked you to fill in this form.',
    submissionId: submission._id,
    spcpSubmissionFailure: false,
  })
}

/**
 * Generate and send admin email
 * @param {Object} req - the expressjs request. Will be injected with the
 * objects parsed from `req.form` and `req.attachments`
 * @param {Array} req.replyToEmails Reply-to emails
 * @param {Object} req.form - the form
 * @param {Array} req.formData Field-value tuples for admin email
 * @param {Object} req.submission Mongodb Submission object
 * @param {Object} req.attachments - submitted attachments, parsed by
 * exports.receiveSubmission
 * @param {Object} res - the expressjs response
 * @param {Object} next - the next expressjs callback
 */
exports.sendAdminEmail = async function (req, res, next) {
  const {
    replyToEmails,
    form,
    formData,
    jsonData,
    submission,
    attachments,
  } = req

  try {
    logger.info({
      message: 'Sending admin mail',
      meta: {
        action: 'sendAdminEmail',
        submissionId: submission.id,
        formId: form._id,
        ...createReqMeta(req),
        submissionHash: submission.responseHash,
      },
    })

    await MailService.sendSubmissionToAdmin({
      replyToEmails,
      form,
      submission,
      attachments,
      jsonData,
      formData,
    })

    return next()
  } catch (err) {
    logger.warn({
      message: 'Error sending submission to admin',
      meta: {
        action: 'sendAdminEmail',
        submissionId: submission.id,
        formId: form._id,
        ...createReqMeta(req),
        submissionHash: submission.responseHash,
      },
      error: err,
    })
    return onSubmissionEmailFailure(err, req, res, submission)
  }
}
