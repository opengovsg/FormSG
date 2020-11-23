'use strict'

const Busboy = require('busboy')
const { Buffer } = require('buffer')
const _ = require('lodash')
const crypto = require('crypto')
const stringify = require('json-stringify-deterministic')
const mongoose = require('mongoose')
const { getEmailSubmissionModel } = require('../models/submission.server.model')
const emailSubmission = getEmailSubmissionModel(mongoose)
const { StatusCodes } = require('http-status-codes')
const { createReqMeta } = require('../utils/request')
const { ConflictError } = require('../modules/submission/submission.errors')
const { MB } = require('../constants/filesize')
const {
  attachmentsAreValid,
  addAttachmentToResponses,
  areAttachmentsMoreThan7MB,
  handleDuplicatesInAttachments,
  mapAttachmentsFromParsedResponses,
} = require('../utils/attachment')
const config = require('../../config/config')
const {
  getProcessedResponses,
} = require('../modules/submission/submission.service')
const logger = require('../../config/logger').createLoggerWithLabel(module)
const MailService = require('../services/mail/mail.service').default

const { sessionSecret } = config

/**
 * Parses multipart-form data request. Parsed attachments are
 * placed into req.attachments and parsed fields are placed into
 * req.body.
 *
 * @param  {Express.Request} req - Express request object
 * @param  {Express.Response} res - Express response object
 * @param  {Function} next - Express next middleware function
 */
exports.receiveEmailSubmissionUsingBusBoy = function (req, res, next) {
  // Attachments
  let attachments = []

  // initialise busboy
  let busboy
  try {
    busboy = new Busboy({
      headers: req.headers,
      limits: {
        fieldSize: 3 * MB,
        fileSize: 7 * MB,
      },
    })
  } catch (err) {
    logger.error({
      message: 'Busboy error',
      meta: {
        action: 'receiveEmailSubmissionUsingBusBoy',
        ...createReqMeta(req),
        formId: _.get(req, 'form._id'),
      },
      error: err,
    })
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Required headers are missing',
    })
  }

  let limitReached = false

  // busboy emitted events
  busboy.on('file', function (fieldname, file, filename) {
    if (filename) {
      let buffers = []
      file.on('data', function (data) {
        buffers.push(data)
      })

      file.on('end', function () {
        let buffer = Buffer.concat(buffers)
        attachments.push({
          filename: fieldname,
          content: buffer,
          fieldId: filename,
        })
        file.resume()
      })

      file.on('limit', function () {
        limitReached = true
      })
    }
  })

  // on receiving body field, convert to JSON
  busboy.on('field', function (name, val, fieldnameTruncated, valueTruncated) {
    if (name === 'body') {
      if (valueTruncated) {
        limitReached = true
        return
      }
      try {
        req.body = JSON.parse(val)
      } catch (err) {
        // Invalid form data
        logger.error({
          message: 'Invalid form data',
          meta: {
            action: 'receiveEmailSubmissionUsingBusBoy',
            ...createReqMeta(req),
            formId: req.form._id,
          },
          error: err,
        })
        return res.sendStatus(StatusCodes.BAD_REQUEST)
      }
    }
  })

  // responses successfully retrieved
  busboy.on('finish', async function () {
    if (limitReached) {
      logger.error({
        message: 'Content is too large',
        meta: {
          action: 'receiveEmailSubmissionUsingBusBoy',
          ...createReqMeta(req),
          formId: req.form._id,
        },
      })
      return res
        .status(StatusCodes.REQUEST_TOO_LONG)
        .json({ message: 'Your submission is too large.' })
    }

    // Log hash of submission for incident investigation purposes
    // Does not include timestamp, so should be unique by submissions content
    const hashedUinFin = res.locals.uinFin
      ? crypto
          .createHmac('sha256', sessionSecret)
          .update(res.locals.uinFin)
          .digest('hex')
      : undefined
    let concatenatedResponse = stringify(req.body) + stringify(attachments)
    const hashedSubmission = concatenatedResponse
      ? crypto
          .createHmac('sha256', sessionSecret)
          .update(concatenatedResponse)
          .digest('hex')
      : undefined

    logger.info({
      message: 'Submission successfully hashed',
      meta: {
        action: 'receiveEmailSubmissionUsingBusBoy',
        formId: req.form._id,
        ...createReqMeta(req),
        uin: hashedUinFin,
        submission: hashedSubmission,
      },
    })

    try {
      const areAttachmentsValid = await attachmentsAreValid(attachments)
      if (!areAttachmentsValid) {
        logger.error({
          message: 'Invalid attachments',
          meta: {
            action: 'receiveEmailSubmissionUsingBusBoy',
            ...createReqMeta(req),
            formId: req.form._id,
          },
        })
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Some files were invalid. Try uploading another file.',
        })
      }

      if (areAttachmentsMoreThan7MB(attachments)) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
          message: 'Please keep the size of your attachments under 7MB.',
        })
      }

      handleDuplicatesInAttachments(attachments)
      addAttachmentToResponses(req.body.responses, attachments)

      return next()
    } catch (error) {
      logger.error({
        message: 'receiveSubmission error',
        meta: {
          action: 'receiveEmailSubmissionUsingBusBoy',
          ...createReqMeta(req),
          formId: req.form._id,
          uin: hashedUinFin,
          submission: hashedSubmission,
        },
        error,
      })
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: 'Unable to process submission.' })
    }
  })

  busboy.on('error', (err) => {
    logger.error({
      message: 'Multipart error',
      meta: {
        action: 'receiveEmailSubmissionUsingBusBoy',
        ...createReqMeta(req),
        formId: req.form._id,
      },
      error: err,
    })
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Unable to process submission.' })
  })

  req.pipe(busboy)
}

/**
 * Extracts relevant fields, injects questions, verifies visibility of field and validates answers
 * to produce req.body.parsedResponses
 *
 * @param  {Express.Request} req - Express request object
 * @param  {Express.Response} res - Express response object
 * @param  {Function} next - Express next middleware function
 */
exports.validateEmailSubmission = function (req, res, next) {
  const { form } = req

  if (req.body.responses) {
    try {
      req.body.parsedResponses = getProcessedResponses(form, req.body.responses)
      delete req.body.responses // Prevent downstream functions from using responses by deleting it
    } catch (err) {
      logger.error({
        message:
          err instanceof ConflictError
            ? 'Conflict - Form has been updated'
            : 'Error processing responses',
        meta: {
          action: 'validateEmailSubmission',
          ...createReqMeta(req),
          formId: req.form._id,
        },
        error: err,
      })
      if (err instanceof ConflictError) {
        return res.status(err.status).json({
          message:
            'The form has been updated. Please refresh and submit again.',
        })
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message:
            'There is something wrong with your form submission. Please check your responses and try again. If the problem persists, please refresh the page.',
        })
      }
    }

    // Creates an array of attachments from the validated responses
    req.attachments = mapAttachmentsFromParsedResponses(
      req.body.parsedResponses,
    )
    return next()
  } else {
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }
}

/**
 * Construct autoReply data and data to send admin from responses submitted
 *
 * @param  {Express.Request} req - Express request object
 * @param  {Express.Response} res - Express response object
 * @param  {Function} next - Express next middleware function
 */
exports.prepareEmailSubmission = (req, res, next) => {
  const { hashedFields } = res.locals

  const concatArray = (dataValue, srcValue) => {
    if (_.isArray(dataValue)) {
      return dataValue.concat(srcValue)
    }
  }

  const result = req.body.parsedResponses.reduce(
    (data, response) => {
      let formattedResponses
      switch (response.fieldType) {
        case 'table':
          formattedResponses = getAnswerRowsForTable(response).map((row) =>
            getFormattedResponse(row, hashedFields),
          )
          break
        case 'checkbox': {
          const checkbox = getAnswerForCheckbox(response)
          formattedResponses = getFormattedResponse(checkbox, hashedFields)
          break
        }
        default:
          formattedResponses = getFormattedResponse(response, hashedFields)
      }
      return _.mergeWith(
        data,
        ...concatArray([], formattedResponses),
        concatArray,
      )
    },
    {
      autoReplyData: [],
      jsonData: [],
      formData: [],
    },
  )

  req.autoReplyData = result.autoReplyData
  req.jsonData = result.jsonData
  req.formData = result.formData
  return next()
}

/**
 * A response is a verified response, if the response is for a myinfo field that has been hashed previously.
 *
 * @param {Object} response
 * @param {String} response.fieldType
 * @param {Object} response.myInfo
 * @param {String} response.myInfo.attr
 * @param {Set} hashedFields req.hashedFields
 * @returns {Boolean} true if response is verified
 */
const isMyInfoVerifiedResponse = (response, hashedFields) => {
  return !!(hashedFields && hashedFields.has(response._id))
}

/**
 * Creates one response for every row of the table using the answerArray
 *
 *
 * @param {Object} response
 * @param {Array} response.answerArray an array of array<string> for each row of the table
 * @returns {Array} array of duplicated response for each answer in the answerArray
 */
const getAnswerRowsForTable = (response) => {
  if (response.answerArray) {
    return response.answerArray.map((answer) => {
      return Object.assign({}, response, { answer: String(answer) })
    })
  }
  return [response]
}

/**
 * Creates a response for checkbox, with its answer formatted from the answerArray
 *
 * @param {Object} response
 * @param {Array} response.answerArray an array of strings for each checked option
 * @returns {Object} the response with formatted answer
 */
const getAnswerForCheckbox = (response) => {
  if (response.answerArray) {
    return Object.assign({}, response, {
      answer: response.answerArray.join(', '),
    })
  }
  return response
}

/**
 *  Formats the response for sending to the submitter (autoReplyData),
 *  the table that is sent to the admin (formData),
 *  and the json used by data collation tool (jsonData).
 *
 * @param {Object} response
 * @param {String} response.question
 * @param {String} response.answer
 * @param {String} response.fieldType
 * @param {Boolean} response.isVisible
 * @param {Set} hashedFields Fields hashed to verify answers provided by MyInfo
 * @returns {Object} an object containing three sets of formatted responses
 */
const getFormattedResponse = (response, hashedFields) => {
  const { question, answer, fieldType, isVisible, isHeader } = response
  const answerTemplate = getAnswerTemplate(answer)
  let result = {}
  // Auto reply email will contain only visible fields
  if (isVisible) {
    result.autoReplyData = {
      question, // No prefixes for autoreply
      answerTemplate,
    }
  }

  // Headers are excluded from JSON data
  if (!isHeader) {
    result.jsonData = {
      question: getJsonPrefixedQuestion(response),
      answer,
    }
  }

  // Send all the fields to admin
  result.formData = {
    question: getFormDataPrefixedQuestion(response, hashedFields),
    answerTemplate,
    answer,
    fieldType,
  }
  return result
}

/**
 * Transforms a question for inclusion in the admin email table.
 * @param {Object} response
 * @param {Set} hashedFields
 */
const getFormDataPrefixedQuestion = (response, hashedFields) => {
  const { question, fieldType, isUserVerified } = response
  const questionComponents = [
    getFieldTypePrefix(fieldType),
    getMyInfoPrefix(response, hashedFields),
    getVerifiedPrefix(isUserVerified),
    question,
  ]
  return questionComponents.join('')
}

/**
 * Transforms a question for inclusion in the JSON data used by the
 * data collation tool.
 * @param {Object} response
 * @param {string} response.question
 * @param {string} response.fieldType
 */
const getJsonPrefixedQuestion = (response) => {
  const { question, fieldType } = response
  const questionComponents = [getFieldTypePrefix(fieldType), question]
  return questionComponents.join('')
}

/**
 * The answer template returns the answer split by newlines so that we can display the newlines
 * in the table of responses that is sent to submitter and form admin
 * @param {String} answer
 * @returns {Array}
 */
const getAnswerTemplate = (answer) => String(answer).split('\n')

/**
 * Determines the prefix for a question based on its field type.
 * @param {String} fieldType
 * @returns {String}
 */
const getFieldTypePrefix = (fieldType) => {
  switch (fieldType) {
    case 'table':
      return `[table] `
    case 'attachment':
      return `[attachment] `
    default:
      return ''
  }
}

/**
 * Determines the prefix for a question based on whether it is verified
 * by MyInfo.
 * @param {Object} response
 * @param {Set} hashedFields Hash for verifying MyInfo fields
 * @returns {String}
 */
const getMyInfoPrefix = (response, hashedFields) => {
  return isMyInfoVerifiedResponse(response, hashedFields) ? '[MyInfo] ' : ''
}

/**
 * Determines the prefix for a question based on whether it was verified
 * by a user during form submission.
 * @param {Boolean} isUserVerified
 * @returns {String}
 */
const getVerifiedPrefix = (isUserVerified) => {
  return isUserVerified ? `[verified] ` : ''
}

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
 * Create hash and optionally salt
 * @param {Array} response response to hash
 * @param {Array} salt optional salt to add to response before hashing
 * @return {Object} hash and salt
 */
function createHash(response, salt) {
  let saltLength = 32
  salt = salt || crypto.randomBytes(saltLength).toString('base64')
  let iterations = 10000
  let keylen = 64
  let digest = 'sha512'
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(response, salt, iterations, keylen, digest, (err, hash) => {
      if (err) reject(err)
      else {
        resolve({
          hash: hash.toString('base64'),
          salt,
        })
      }
    })
  })
}

/**
 * Concatenate response for hashing
 * @param {Array} formData Field-value tuples for admin email
 * @param {Array} attachments Array of attachments as buffers
 * @return {String} concatenated response to hash
 */
function concatResponse(formData, attachments) {
  let response = ''
  for (let fieldTuple of formData) {
    let { question, answer } = fieldTuple
    question = question.toString().trim()
    answer = answer.toString().trim()
    // Append to overall response string
    response += `${question} ${answer}; `
  }
  for (let attachment of attachments) {
    response += attachment.content
  }
  return response
}

/**
 * Saves new Submission object to db when form.responseMode is email
 * @param {Object} req - Express request object
 * @param {Object} req.form - form object from req
 * @param {Object} req.formData - the submission for the form
 * @param {Object} req.attachments - submitted attachments, parsed by
 * exports.receiveSubmission
 * @param {Object} res - Express response object
 * @param {Object} next - the next expressjs callback, invoked once attachments
 * are processed
 */
exports.saveMetadataToDb = function (req, res, next) {
  const { form, attachments, formData } = req
  const { requestedAttributes } = res.locals

  let submission = new emailSubmission({
    form: form._id,
    authType: form.authType,
    myInfoFields: requestedAttributes,
    recipientEmails: form.emails,
  })

  // Create submission hash
  let concatenatedResponse = concatResponse(formData, attachments)

  createHash(concatenatedResponse)
    .then((result) => {
      submission.responseHash = result.hash
      submission.responseSalt = result.salt
      // Save submission to database
      return submission.save()
    })
    .then((submission) => {
      logger.info({
        message: 'Saved submission to MongoDB',
        meta: {
          action: 'saveMetadataToDb',
          submissionId: submission.id,
          formId: form._id,
          ...createReqMeta(req),
          responseHash: submission.responseHash,
        },
      })
      req.submission = submission
      return next()
    })
    .catch((err) => {
      return onSubmissionEmailFailure(err, req, res, submission)
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
