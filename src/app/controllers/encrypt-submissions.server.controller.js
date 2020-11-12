'use strict'
const crypto = require('crypto')
const moment = require('moment-timezone')
const { Transform } = require('stream')
const JSONStream = require('JSONStream')
const { StatusCodes } = require('http-status-codes')

const mongoose = require('mongoose')
const errorHandler = require('../utils/handle-mongo-error')
const {
  getEncryptSubmissionModel,
} = require('../models/submission.server.model')
const getSubmissionModel = require('../models/submission.server.model').default
const Submission = getSubmissionModel(mongoose)
const EncryptSubmission = getEncryptSubmissionModel(mongoose)

const {
  isValidEncryptSubmission,
  processResponses,
} = require('../utils/encrypt-submission')
const { ConflictError } = require('../modules/submission/submission.errors')
const { createReqMeta } = require('../utils/request')
const { isMalformedDate, createQueryWithDateParam } = require('../utils/date')
const logger = require('../../config/logger').createLoggerWithLabel(module)
const {
  aws: { attachmentS3Bucket, s3 },
} = require('../../config/config')

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
  const isValid = isValidEncryptSubmission(req)
  if (!isValid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Invalid data was found. Please submit again.' })
  }

  if (req.body.responses) {
    try {
      processResponses(req)
      return next()
    } catch (err) {
      if (err instanceof ConflictError) {
        return res.status(StatusCodes.CONFLICT).json({
          message:
            'The form has been updated. Please refresh and submit again.',
        })
      }
    }
  }
  return res.status(StatusCodes.BAD_REQUEST).json({
    message:
      'There is something wrong with your form submission. Please check your responses and try again. If the problem persists, please refresh the page.',
  })
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

/**
 * Return actual encrypted form responses matching submission id
 * @param {Object} req - Express request object
 * @param {String} req.query.submissionId - submission to return data for
 * @param {Object} req.form - the form
 * @param {Object} res - Express response object
 */
exports.getEncryptedResponse = function (req, res) {
  let { submissionId } = req.query || {}

  Submission.findOne(
    {
      form: req.form._id,
      _id: submissionId,
      submissionType: 'encryptSubmission',
    },
    {
      encryptedContent: 1,
      verifiedContent: 1,
      attachmentMetadata: 1,
      created: 1,
    },
  ).exec(async (err, response) => {
    if (err || !response) {
      logger.error({
        message: 'Failure retrieving encrypted submission from database',
        meta: {
          action: 'getEncryptedResponse',
          ...createReqMeta(req),
        },
        error: err,
      })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: errorHandler.getMongoErrorMessage(err),
      })
    } else {
      const entry = {
        refNo: response._id,
        submissionTime: moment(response.created)
          .tz('Asia/Singapore')
          .format('ddd, D MMM YYYY, hh:mm:ss A'),
        content: response.encryptedContent,
        verified: response.verifiedContent,
      }
      // make sure client obtains S3 presigned URLs to download attachments
      if (response.attachmentMetadata) {
        const attachmentMetadata = {}
        for (let [key, objectPath] of response.attachmentMetadata) {
          attachmentMetadata[key] = await s3.getSignedUrlPromise('getObject', {
            Bucket: attachmentS3Bucket,
            Key: objectPath,
            Expires: req.session.cookie.maxAge / 1000, // Remaining login duration in seconds
          })
        }
        entry.attachmentMetadata = attachmentMetadata
      } else {
        entry.attachmentMetadata = {}
      }
      return res.json(entry)
    }
  })
}

function getS3UrlForAttachmentsPipeline(enabled, urlValidDuration) {
  let st = new Transform({
    objectMode: true,
    transform(data, encoding, callback) {
      if (
        enabled &&
        data.attachmentMetadata &&
        Object.keys(data.attachmentMetadata).length > 0
      ) {
        const unprocessedMetadata = data.attachmentMetadata
        const totalCount = Object.keys(data.attachmentMetadata).length

        data.attachmentMetadata = {}
        let processedCount = 0
        for (let [key, objectPath] of Object.entries(unprocessedMetadata)) {
          s3.getSignedUrl(
            'getObject',
            {
              Bucket: attachmentS3Bucket,
              Key: objectPath,
              Expires: urlValidDuration,
            },
            function (err, url) {
              if (err) callback(err)
              data.attachmentMetadata[key] = url
              processedCount += 1
              if (processedCount == totalCount) {
                callback(null, data)
              }
            },
          )
        }
      } else {
        data.attachmentMetadata = {}
        callback(null, data)
      }
    },
  })
  return st
}

exports.streamEncryptedResponses = async function (req, res) {
  if (
    isMalformedDate(req.query.startDate) ||
    isMalformedDate(req.query.endDate)
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Malformed date parameter',
    })
  }

  let downloadAttachments = false
  if (req.query.downloadAttachments) {
    downloadAttachments = true
  }

  let query = {
    form: req.form._id,
    submissionType: 'encryptSubmission',
  }

  const augmentedQuery = createQueryWithDateParam(
    req.query.startDate,
    req.query.endDate,
  )

  query = { ...query, ...augmentedQuery }

  Submission.find(query, {
    encryptedContent: 1,
    verifiedContent: 1,
    attachmentMetadata: 1,
    created: 1,
    id: 1,
  })
    .setOptions({
      batchSize: 2000,
      readPreference: 'secondary',
    })
    .lean()
    .cursor()
    .on('error', function (err) {
      logger.error({
        message: 'Error streaming submissions from database',
        meta: {
          action: 'streamEncryptedResponse',
          ...createReqMeta(req),
        },
        error: err,
      })
      res.status(500).json({
        message: 'Error retrieving from database.',
      })
    })
    .pipe(
      getS3UrlForAttachmentsPipeline(
        downloadAttachments,
        req.session.cookie.maxAge / 1000,
      ),
    )
    // If you call JSONStream.stringify(false) the elements will only be
    // seperated by a newline.
    .pipe(JSONStream.stringify(false))
    .on('error', function (err) {
      logger.error({
        message: 'Error converting submissions to JSON',
        meta: {
          action: 'streamEncryptedResponse',
          ...createReqMeta(req),
        },
        error: err,
      })
      res.status(500).json({
        message: 'Error converting submissions to JSON',
      })
    })
    .pipe(res.type('application/x-ndjson'))
    .on('error', function (err) {
      logger.error({
        message: 'Error writing submissions to HTTP stream',
        meta: {
          action: 'streamEncryptedResponse',
          ...createReqMeta(req),
        },
        error: err,
      })
      res.status(500).json({
        message: 'Error writing submissions to HTTP stream',
      })
    })
    .on('end', function () {
      res.end()
    })
}
