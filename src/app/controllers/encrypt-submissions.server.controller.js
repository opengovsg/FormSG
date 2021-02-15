'use strict'
const crypto = require('crypto')
const { StatusCodes } = require('http-status-codes')

const mongoose = require('mongoose')
const {
  getEncryptSubmissionModel,
} = require('../models/submission.server.model')
const EncryptSubmission = getEncryptSubmissionModel(mongoose)

const { createReqMeta } = require('../utils/request')
const logger = require('../../config/logger').createLoggerWithLabel(module)
const {
  aws: { attachmentS3Bucket, s3 },
} = require('../../config/config')

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
  const logMeta = {
    action: 'saveResponseToDb',
    formId: form._id,
    ...createReqMeta(req),
  }
  const { verified } = res.locals
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
            meta: logMeta,
            error: err,
          })
          return onEncryptSubmissionFailure(err, req, res, submission)
        }),
    )
  }

  const submission = new EncryptSubmission({
    form: form._id,
    authType: form.authType,
    myInfoFields: form.getUniqueMyInfoAttrs(),
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
      logger.info({
        message: 'Saved submission to MongoDB',
        meta: {
          ...logMeta,
          submissionId: savedSubmission._id,
        },
      })
      req.submission = savedSubmission
      return next()
    })
    .catch((err) => {
      return onEncryptSubmissionFailure(err, req, res, submission)
    })
}
