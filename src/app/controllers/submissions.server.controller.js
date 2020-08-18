'use strict'

const axios = require('axios')
const _ = require('lodash')

const mongoose = require('mongoose')
const errorHandler = require('./errors.server.controller')
const getSubmissionModel = require('../models/submission.server.model').default
const Submission = getSubmissionModel(mongoose)

const HttpStatus = require('http-status-codes')

const { getRequestIp } = require('../utils/request')
const { isMalformedDate, createQueryWithDateParam } = require('../utils/date')
const {
  parseAutoReplyData,
  generateAutoReplyPdf,
} = require('../utils/autoreply-pdf')
const { renderPromise } = require('../utils/render-promise')
const config = require('../../config/config')
const logger = require('../../config/logger').createLoggerWithLabel(
  'authentication',
)
const { sendNodeMail } = require('../services/mail.service')
const { EMAIL_HEADERS, EMAIL_TYPES } = require('../utils/constants')

const GOOGLE_RECAPTCHA_URL = 'https://www.google.com/recaptcha/api/siteverify'

/**
 * Validate captcha before allowing submission
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Object} next - Express next middleware function
 */
exports.captchaCheck = (captchaPrivateKey) => {
  return (req, res, next) => {
    if (!req.form.hasCaptcha) {
      return next()
    } else {
      if (!captchaPrivateKey) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
          message: 'Captcha not set-up',
        })
      } else if (!req.query.captchaResponse) {
        logger.error(
          `[${
            req.form._id
          }] Error 400: Missing captchaResponse ip=${getRequestIp(req)}`,
        )
        return res.status(HttpStatus.BAD_REQUEST).send({
          message: 'Captcha was missing. Please refresh and submit again.',
        })
      } else {
        axios
          .get(GOOGLE_RECAPTCHA_URL, {
            params: {
              secret: captchaPrivateKey,
              response: req.query.captchaResponse,
              remoteip: req.connection.remoteAddress,
            },
          })
          .then(({ data }) => {
            if (!data.success) {
              logger.error(
                `Error 400 - Incorrect captchaResponse: formId=${
                  req.form._id
                } ip=${getRequestIp(req)}`,
              )
              return res.status(HttpStatus.BAD_REQUEST).send({
                message: 'Captcha was incorrect. Please submit again.',
              })
            }
            return next()
          })
          .catch((err) => {
            // Problem with the verificationUrl - maybe it timed out?
            logger.error(
              `[${req.form._id}] Error verifying captcha, ip=${getRequestIp(
                req,
              )}`,
              err,
            )
            return res.status(HttpStatus.BAD_REQUEST).send({
              message:
                'Could not verify captcha. Please submit again in a few minutes.',
            })
          })
      }
    }
  }
}

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
 * @param {Array} req.replyToEmails Reply-to emails
 * @param {Object} req.form - the form
 * @param {Array<Array<string>>} req.autoReplyData Field-value tuples for auto-replies
 * @param {Object} req.submission Mongodb Submission object
 * @param {Object} req.attachments - submitted attachments, parsed by
 * @param {Object} res - Express response object
 */
const sendEmailAutoReplies = async function (req, res) {
  const { form, attachments, autoReplyEmails, autoReplyData, submission } = req
  if (autoReplyEmails.length === 0) {
    return Promise.resolve()
  }
  const renderData = parseAutoReplyData(
    form,
    submission,
    autoReplyData,
    req.get('origin') || config.app.appUrl,
  )
  try {
    if (_.some(autoReplyEmails, ['includeFormSummary', true])) {
      const pdfBuffer = await generateAutoReplyPdf({ renderData, res })
      attachments.push({
        filename: 'response.pdf',
        content: pdfBuffer,
      })
    }
    // If one promise is rejected, carry on with the rest
    return Promise.allSettled(
      autoReplyEmails.map((autoReplyEmail, index) =>
        sendOneEmailAutoReply(
          req,
          res,
          autoReplyEmail,
          renderData,
          attachments,
          index,
        ),
      ),
    )
  } catch (err) {
    logger.error(
      `Email autoreply error for formId=${form._id} submissionId=${submission.id}:\t${err}`,
    )
    // We do not deal with failed autoreplies
    return Promise.resolve()
  }
}

/**
 * Render and send auto-reply emails to the form submitter
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Array} autoReplyEmails Auto-reply email fields
 * @param {Object} form Form object
 * @param {Object} renderData Data about the submission and answers to form questions. This is the raw
 *   data that is rendered on the response PDF if the PDF was needed, otherwise it is null.
 * @param {String} submissionId The ObjectId of the submission
 * @param {Array<Object>} attachments The attachments to send to form submitter.
 * @param {String} attachment.filename Name of file
 * @param {Buffer} attachment.buffer Contents of file
 */
async function sendOneEmailAutoReply(
  req,
  res,
  autoReplyEmail,
  renderData,
  attachments,
  index,
) {
  const { form, submission } = req
  const submissionId = submission.id
  const defaultSubject = 'Thank you for submitting ' + form.title
  const defaultSender = form.admin.agency.fullName
  const defaultBody = `Dear Sir or Madam,\n\nThank you for submitting this form.\n\nRegards,\n${form.admin.agency.fullName}`
  const autoReplyBody = (autoReplyEmail.body || defaultBody).split('\n')

  // Only include the form response if the flag is set
  const templateData = autoReplyEmail.includeFormSummary
    ? { autoReplyBody, ...renderData }
    : { autoReplyBody }
  let autoReplyHtml
  try {
    autoReplyHtml = await renderPromise(
      res,
      'templates/submit-form-autoreply',
      templateData,
    )
  } catch (err) {
    logger.warn('Render autoreply error', err)
    return Promise.reject(err)
  }
  const senderName = autoReplyEmail.sender || defaultSender
  // Sender's name appearing after ( symbol gets truncated. Escaping it solves the problem.
  const escapedSenderName = senderName.replace('(', '\\(')

  const mail = {
    to: autoReplyEmail.email,
    from: `${escapedSenderName} <${config.mail.mailFrom}>`,
    subject: autoReplyEmail.subject || defaultSubject,
    // Only send attachments if the admin has the box checked for email field
    attachments: autoReplyEmail.includeFormSummary ? attachments : [],
    html: autoReplyHtml,
    headers: {
      [EMAIL_HEADERS.formId]: String(form._id),
      [EMAIL_HEADERS.submissionId]: submission.id,
      [EMAIL_HEADERS.emailType]: EMAIL_TYPES.emailConfirmation,
    },
  }
  try {
    return sendNodeMail({
      mail,
      options: {
        retryCount: config.mail.retry.maxRetryCount,
        mailId: `${submissionId}-${index}`,
      },
    })
  } catch (err) {
    logger.error(`Mail autoreply error:\t ip=${getRequestIp(req)}`, err)
    return Promise.reject(err)
  }
}

/**
 * Count number of form submissions for Results tab
 * @param  {Object} req - Express request object
 * @param  {String} [req.query.startDate] Optional date query parameter in YYYY-MM-DD format. Assumes GMT+8.
 * @param  {String} [req.query.endDate] Optional date query parameter in YYYY-MM-DD format. Assumes GMT+8.
 * @param  {Object} res - Express response object
 */
exports.count = function (req, res) {
  let query = { form: req.form._id }

  if (
    isMalformedDate(req.query.startDate) ||
    isMalformedDate(req.query.endDate)
  ) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      message: 'Malformed date parameter',
    })
  }

  const augmentedQuery = createQueryWithDateParam(
    req.query.startDate,
    req.query.endDate,
  )

  query = { ...query, ...augmentedQuery }

  Submission.countDocuments(query, function (err, count) {
    if (err) {
      logger.error(getRequestIp(req), req.url, req.headers, err)
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        message: errorHandler.getMongoErrorMessage(err),
      })
    } else {
      return res.json(count)
    }
  })
}

exports.sendAutoReply = function (req, res) {
  const { form, submission } = req
  // Return the reply early to the submitter
  res.send({
    message: 'Form submission successful.',
    submissionId: submission.id,
  })
  // We do not handle failed autoreplies
  const autoReplies = [sendEmailAutoReplies(req, res)]
  return Promise.all(autoReplies).catch((err) => {
    logger.error(
      `Autoreply error for formId=${form._id} submissionId=${submission.id}:\t${err}`,
    )
  })
}
