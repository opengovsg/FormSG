'use strict'

const { createReqMeta } = require('../utils/request')
const logger = require('../../config/logger').createLoggerWithLabel(module)
const MailService = require('../services/mail/mail.service').default

/**
 * Injects auto-reply SMS/Email info
 * @param {Object} req - the expressjs request. Will be injected with the
 * objects parsed from `req.form` and `req.body.parsedResponses`
 * @param {Object} req.form - the form from the middleware forms.formById
 * @param {Object} req.body - the submission for the form
 * @param {Object} res - the expressjs response
 * @param {Object} next - the next expressjs callback, invoked once attachments
 * are processed
 */
exports.injectAutoReplyInfo = function (req, res, next) {
  const { form } = req

  // Lookup table
  const table = (form.form_fields || []).reduce((obj, item) => {
    obj[item._id] = item
    return obj
  }, {})

  // Fetch autoreply data from table and inject into req
  // TODO: req.body.parsedResponses does not exist for encrypted responses!
  const autoReplies = (req.body.parsedResponses || []).reduce(
    (obj, item) => {
      switch (item.fieldType) {
        case 'email':
          if (table[item._id] && item.answer) {
            // Email validation handled by validateSubmission middleware
            const options = table[item._id].autoReplyOptions
            if (options.hasAutoReply) {
              // We will send autoreply emails even with responseMode = encrypt,
              // but with no submission data
              // schema enforces that includeFormSummary=false for encrypt forms
              obj.email.push({
                email: item.answer,
                subject: options.autoReplySubject,
                sender: options.autoReplySender,
                body: options.autoReplyMessage,
                includeFormSummary: options.includeFormSummary,
              })
            }
            // Reply-to enabled by default
            obj.replyToEmails.push(item.answer)
          }

          return obj
        default:
          return obj
      }
    },
    {
      email: [],
      replyToEmails: [],
    },
  )

  req.autoReplyEmails = autoReplies.email
  req.autoReplySms = autoReplies.sms
  req.replyToEmails = autoReplies.replyToEmails

  return next()
}

/**
 * Long waterfall to send autoreply
 * @param {Object} req - Express request object
 * @param {Array<Object>} req.autoReplyEmails Auto-reply email fields
 * @param {Object} req.form - the form
 * @param {Array<Array<string>>} req.autoReplyData Field-value tuples for auto-replies
 * @param {Object} req.submission Mongodb Submission object
 * @param {Object} req.attachments - submitted attachments, parsed by
 */
const sendEmailAutoReplies = async function (req) {
  const { form, attachments, autoReplyEmails, autoReplyData, submission } = req
  if (autoReplyEmails.length === 0) {
    return Promise.resolve()
  }

  try {
    return MailService.sendAutoReplyEmails({
      form,
      submission,
      attachments,
      responsesData: autoReplyData,
      autoReplyMailDatas: autoReplyEmails,
    })
  } catch (err) {
    logger.error({
      message: 'Failed to send autoreply emails',
      meta: {
        action: 'sendEmailAutoReplies',
        ...createReqMeta(req),
        formId: req.form._id,
        submissionId: submission.id,
      },
      error: err,
    })
    // We do not deal with failed autoreplies
    return Promise.resolve()
  }
}

exports.sendAutoReply = function (req, res) {
  const { form, submission } = req
  // Return the reply early to the submitter
  res.json({
    message: 'Form submission successful.',
    submissionId: submission.id,
  })
  // We do not handle failed autoreplies
  const autoReplies = [sendEmailAutoReplies(req, res)]
  return Promise.all(autoReplies).catch((err) => {
    logger.error({
      message: 'Error sending autoreply',
      meta: {
        action: 'sendAutoReply',
        formId: form._id,
        submissionId: submission.id,
      },
      error: err,
    })
  })
}
