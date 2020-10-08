'use strict'

const axios = require('axios')

const mongoose = require('mongoose')
const errorHandler = require('./errors.server.controller')
const getSubmissionModel = require('../models/submission.server.model').default
const Submission = getSubmissionModel(mongoose)

const { StatusCodes } = require('http-status-codes')

const { getRequestIp, getTrace } = require('../utils/request')
const { isMalformedDate, createQueryWithDateParam } = require('../utils/date')
const logger = require('../../config/logger').createLoggerWithLabel(module)
const MailService = require('../services/mail.service').default

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
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Captcha not set-up',
        })
      } else if (!req.query.captchaResponse) {
        logger.error({
          message: 'Missing captchaResponse param',
          meta: {
            action: 'captchaCheck',
            formId: req.form._id,
            ip: getRequestIp(req),
            trace: getTrace(req),
          },
        })
        return res.status(StatusCodes.BAD_REQUEST).json({
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
              logger.error({
                message: 'Incorrect captcha response',
                meta: {
                  action: 'captchaCheck',
                  formId: req.form._id,
                  ip: getRequestIp(req),
                  trace: getTrace(req),
                },
              })
              return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Captcha was incorrect. Please submit again.',
              })
            }
            return next()
          })
          .catch((err) => {
            // Problem with the verificationUrl - maybe it timed out?
            logger.error({
              message: 'Error verifying captcha',
              meta: {
                action: 'captchaCheck',
                formId: req.form._id,
                ip: getRequestIp(req),
                trace: getTrace(req),
              },
              error: err,
            })
            return res.status(StatusCodes.BAD_REQUEST).json({
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
        ip: getRequestIp(req),
        trace: getTrace(req),
        formId: req.form._id,
        submissionId: submission.id,
      },
      error: err,
    })
    // We do not deal with failed autoreplies
    return Promise.resolve()
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
    return res.status(StatusCodes.BAD_REQUEST).json({
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
      logger.error({
        message: 'Error counting submission documents from database',
        meta: {
          action: 'count',
          ip: getRequestIp(req),
          trace: getTrace(req),
          url: req.url,
          headers: req.headers,
        },
        error: err,
      })

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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
