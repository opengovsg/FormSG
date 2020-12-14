'use strict'

const crypto = require('crypto')
const mongoose = require('mongoose')
const { getEmailSubmissionModel } = require('../models/submission.server.model')
const emailSubmission = getEmailSubmissionModel(mongoose)
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

  let submission = new emailSubmission({
    form: form._id,
    authType: form.authType,
    myInfoFields: form.getUniqueMyInfoAttrs(),
    recipientEmails: form.emails,
  })

  // Create submission hash
  let concatenatedResponse

  try {
    concatenatedResponse = concatResponse(formData, attachments)
  } catch (err) {
    logger.error({
      message: 'Error concatenating response for submission hash',
      meta: {
        action: 'concatResponse',
        ...createReqMeta(req),
        formId: req.form._id,
      },
      error: err,
    })
    return res.status(StatusCodes.BAD_REQUEST).json({
      message:
        'There is something wrong with your form submission. Please check your responses and try again. If the problem persists, please refresh the page.',
    })
  }

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
