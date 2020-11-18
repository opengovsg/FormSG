'use strict'
const crypto = require('crypto')
const { StatusCodes } = require('http-status-codes')

const mongoose = require('mongoose')
const errorHandler = require('../utils/handle-mongo-error')
const {
  getEncryptSubmissionModel,
} = require('../models/submission.server.model')
const EncryptSubmission = getEncryptSubmissionModel(mongoose)

const { checkIsEncryptedEncoding } = require('../utils/encryption')
const { ConflictError } = require('../modules/submission/submission.errors')
const { createReqMeta } = require('../utils/request')
const logger = require('../../config/logger').createLoggerWithLabel(module)
const {
  aws: { attachmentS3Bucket, s3 },
} = require('../../config/config')
const {
  getProcessedResponses,
} = require('../modules/submission/submission.service')

const HttpStatus = require('http-status-codes')

/**
 * Extracts relevant fields, injects questions, verifies visibility of field and validates answers
 * to produce req.body.parsedResponses
 *
 * @param  {Express.Request} req - Express request object
 * @param  {Express.Response} res - Express response object
 * @param  {Function} next - Express next middleware function
 */
exports.validateEncryptSubmission = function (req, res, next) {
  const { form } = req

  const isEncryptedResult = checkIsEncryptedEncoding(req.body.encryptedContent)
  if (isEncryptedResult.isErr()) {
    logger.error({
      message: 'Invalid encryption',
      meta: {
        action: 'validateEncryptSubmission',
        ...createReqMeta(req),
        formId: form._id,
      },
      error: isEncryptedResult.error,
    })
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Invalid data was found. Please submit again.' })
  }

  if (req.body.responses) {
    const getProcessedResponsesResult = getProcessedResponses(
      form,
      req.body.responses,
    )
    if (getProcessedResponsesResult.isOk()) {
      req.body.parsedResponses = getProcessedResponsesResult.value
      delete req.body.responses // Prevent downstream functions from using responses by deleting it
      return next()
    }
    const err = getProcessedResponsesResult.error
    logger.error({
      message: 'Error processing responses',
      meta: {
        action: 'validateEncryptSubmission',
        ...createReqMeta(req),
        formId: form._id,
      },
      error: err,
    })
    if (err instanceof ConflictError) {
      return res.status(err.status).json({
        message: 'The form has been updated. Please refresh and submit again.',
      })
    }
    return res.status(StatusCodes.BAD_REQUEST).json({
      message:
        'There is something wrong with your form submission. Please check your responses and try again. If the problem persists, please refresh the page.',
    })
  }
  return res.status(StatusCodes.BAD_REQUEST)
}

/**
 * Verify structure of encrypted response
 *
 * @param  {Express.Request} req - Express request object
 * @param  {Express.Response} res - Express response object
 * @param  {Function} next - Express next middleware function
 */
exports.prepareEncryptSubmission = (req, res, next) => {
  req.formData = req.body.encryptedContent
  req.attachmentData = req.body.attachments || {}
  return next()
}

/**
 * @param {Error} err - the Error to report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} submission - the Mongoose model instance
 * of the submission
 */
function onEncryptSubmissionFailure(err, req, res, submission) {
  logger.error({
    message: 'Encrypt submission error',
    meta: {
      action: 'onEncryptSubmissionFailure',
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
 * @typedef AttachmentData
 * @type {Object<string, EncryptedAttachment>} Object with keys as form field IDs
 */

/**
 * @typedef EncryptedAttachment
 * @property {object} encryptedFile
 * @property {string} encryptedFile.submissionPublicKey
 * @property {string} encryptedFile.nonce
 * @property {string} encryptedFile.binary Attachment binary in base64
 *
 */

/**
 * Uploads attachments to S3 and a saves new Submission to the database for encrypted forms.
 * @param {Object} req - Express request object
 * @param {Object} req.form - f
 * @param {Object} req.formData - the submission for the form
 * @param {AttachmentData} req.attachmentData - attachments for the form if any
 * @param {Object} res - Express response object
 * @param {Object} res.locals - Express response containing local variables scoped to the request
 * @param {Object} res.locals.verified - any signed+encrypted verified object from server.
 * @param {Object} next - the next expressjs callback, invoked once attachments
 * are processed
 */
exports.saveResponseToDb = function (req, res, next) {
  const { form, formData, attachmentData } = req
  const { verified, requestedAttributes } = res.locals
  let attachmentMetadata = new Map()
  let attachmentUploadPromises = []

  // Object.keys(attachmentData[fieldId].encryptedFile) [ 'submissionPublicKey', 'nonce', 'binary' ]
  for (let fieldId in attachmentData) {
    const individualAttachment = JSON.stringify(attachmentData[fieldId])

    const hashStr = crypto
      .createHash('sha256')
      .update(individualAttachment)
      .digest('hex')

    const uploadKey =
      form._id + '/' + crypto.randomBytes(20).toString('hex') + '/' + hashStr

    attachmentMetadata.set(fieldId, uploadKey)

    attachmentUploadPromises.push(
      s3
        .upload({
          Bucket: attachmentS3Bucket,
          Key: uploadKey,
          Body: Buffer.from(individualAttachment),
        })
        .promise()
        .catch((err) => {
          logger.error({
            message: 'Attachment upload error',
            meta: {
              action: 'saveResponseToDb',
              ...createReqMeta(req),
            },
            error: err,
          })
          return onEncryptSubmissionFailure(err, req, res, submission)
        }),
    )
  }

  const submission = new EncryptSubmission({
    form: form._id,
    authType: form.authType,
    myInfoFields: requestedAttributes,
    encryptedContent: formData,
    verifiedContent: verified,
    attachmentMetadata,
    version: req.body.version,
  })

  Promise.all(attachmentUploadPromises)
    .then((_) => {
      return submission.save()
    })
    .then((savedSubmission) => {
      req.submission = savedSubmission
      return next()
    })
    .catch((err) => {
      return onEncryptSubmissionFailure(err, req, res, submission)
    })
}

/**
 * Return metadata for encrypted form responses matching form._id
 * @param {Object} req - Express request object
 * @param {String} req.query.pageNo - page of table to return data for
 * @param {Object} req.form - the form
 * @param {Object} res - Express response object
 */
exports.getMetadata = function (req, res) {
  let { page, submissionId } = req.query || {}

  if (submissionId) {
    // Early return if submissionId is invalid.
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(HttpStatus.OK).json({ metadata: [], count: 0 })
    }

    return EncryptSubmission.findSingleMetadata(req.form._id, submissionId)
      .then((result) => {
        if (!result) {
          return res.status(HttpStatus.OK).json({ metadata: [], count: 0 })
        }

        return res.status(HttpStatus.OK).json({ metadata: [result], count: 1 })
      })
      .catch((error) => {
        logger.error({
          message: 'Failure retrieving metadata from database',
          meta: {
            action: 'getMetadata',
            ...createReqMeta(req),
          },
          error,
        })
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: errorHandler.getMongoErrorMessage(error),
        })
      })
  } else {
    return EncryptSubmission.findAllMetadataByFormId(req.form._id, { page })
      .then((result) => res.status(StatusCodes.OK).json(result))
      .catch((error) => {
        logger.error({
          message: 'Failure retrieving metadata from database',
          meta: {
            action: 'getMetadata',
            ...createReqMeta(req),
          },
          error: error,
        })
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: errorHandler.getMongoErrorMessage(error),
        })
      })
  }
}
