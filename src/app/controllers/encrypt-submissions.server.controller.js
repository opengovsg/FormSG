'use strict'
const crypto = require('crypto')
const moment = require('moment-timezone')
const JSONStream = require('JSONStream')
const { StatusCodes } = require('http-status-codes')

const mongoose = require('mongoose')
const errorHandler = require('./errors.server.controller')
const {
  getEncryptSubmissionModel,
} = require('../models/submission.server.model')
const getSubmissionModel = require('../models/submission.server.model').default
const Submission = getSubmissionModel(mongoose)
const encryptSubmission = getEncryptSubmissionModel(mongoose)

const { checkIsEncryptedEncoding } = require('../utils/encryption')
const { ConflictError } = require('../modules/submission/submission.errors')
const { getRequestIp, getTrace } = require('../utils/request')
const { isMalformedDate, createQueryWithDateParam } = require('../utils/date')
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
  try {
    // Check if the encrypted content is base64
    checkIsEncryptedEncoding(req.body.encryptedContent)
  } catch (error) {
    logger.error({
      message: 'Invalid encryption',
      meta: {
        action: 'validateEncryptSubmission',
        ip: getRequestIp(req),
        trace: getTrace(req),
        formId: form._id,
      },
      error,
    })
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Invalid data was found. Please submit again.' })
  }

  if (req.body.responses) {
    try {
      req.body.parsedResponses = getProcessedResponses(form, req.body.responses)
      delete req.body.responses // Prevent downstream functions from using responses by deleting it
    } catch (err) {
      logger.error({
        message: 'Error processing responses',
        meta: {
          action: 'validateEncryptSubmission',
          ip: getRequestIp(req),
          trace: getTrace(req),
          formId: form._id,
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
    return next()
  } else {
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }
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
      ip: getRequestIp(req),
      trace: getTrace(req),
      url: req.url,
      headers: req.headers,
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
              trace: getTrace(req),
            },
            error: err,
          })
          return onEncryptSubmissionFailure(err, req, res, submission)
        }),
    )
  }

  const submission = new encryptSubmission({
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
  let pageSize = 10
  let { page, submissionId } = req.query || {}
  let numToSkip = parseInt(page - 1 || 0) * pageSize

  let matchClause = {
    form: req.form._id,
    submissionType: 'encryptSubmission',
  }

  if (submissionId) {
    if (mongoose.Types.ObjectId.isValid(submissionId)) {
      matchClause._id = mongoose.Types.ObjectId(submissionId)
      // Reading from primary to avoid any contention issues with bulk queries on secondary servers
      Submission.findOne(matchClause, { created: 1 })
        .read('primary')
        .exec((err, result) => {
          if (err) {
            logger.error({
              message: 'Failure retrieving metadata from database',
              meta: {
                action: 'getMetadata',
                ip: getRequestIp(req),
                trace: getTrace(req),
                url: req.url,
                headers: req.headers,
              },
              error: err,
            })
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              message: errorHandler.getMongoErrorMessage(err),
            })
          }
          if (!result) {
            return res.status(HttpStatus.OK).json({ metadata: [], count: 0 })
          }
          let entry = {
            number: 1,
            refNo: result._id,
            submissionTime: moment(result.created)
              .tz('Asia/Singapore')
              .format('Do MMM YYYY, h:mm:ss a'),
          }
          return res.status(HttpStatus.OK).json({ metadata: [entry], count: 1 })
        })
    } else {
      return res.status(HttpStatus.OK).json({ metadata: [], count: 0 })
    }
  } else {
    Submission.aggregate([
      {
        $match: matchClause,
      },
      {
        $sort: { created: -1 },
      },
      {
        $facet: {
          pageResults: [
            {
              $skip: numToSkip,
            },
            {
              $limit: pageSize,
            },
            {
              $project: {
                _id: 1,
                created: 1,
              },
            },
          ],
          allResults: [
            {
              $group: {
                _id: null,
                count: {
                  $sum: 1,
                },
              },
            },
            {
              $project: {
                _id: 0,
              },
            },
          ],
        },
      },
    ])
      .allowDiskUse(true) // prevents out-of-memory for large search results (max 100MB)
      .exec((err, result) => {
        if (err || !result) {
          logger.error({
            message: 'Failure retrieving metadata from database',
            meta: {
              action: 'getMetadata',
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
          const [{ pageResults, allResults }] = result
          let [numResults] = allResults
          let count = (numResults && numResults.count) || 0
          let number = count - numToSkip
          let metadata = pageResults.map((data) => {
            let entry = {
              number,
              refNo: data._id,
              submissionTime: moment(data.created)
                .tz('Asia/Singapore')
                .format('Do MMM YYYY, h:mm:ss a'),
            }
            number--
            return entry
          })
          return res.status(StatusCodes.OK).json({ metadata, count })
        }
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

exports.streamEncryptedResponses = async function (req, res) {
  if (
    isMalformedDate(req.query.startDate) ||
    isMalformedDate(req.query.endDate)
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Malformed date parameter',
    })
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
          ip: getRequestIp(req),
          trace: getTrace(req),
        },
        error: err,
      })
      res.status(500).json({
        message: 'Error retrieving from database.',
      })
    })
    // If you call JSONStream.stringify(false) the elements will only be
    // seperated by a newline.
    .pipe(JSONStream.stringify(false))
    .on('error', function (err) {
      logger.error({
        message: 'Error converting submissions to JSON',
        meta: {
          action: 'streamEncryptedResponse',
          ip: getRequestIp(req),
          trace: getTrace(req),
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
          ip: getRequestIp(req),
          trace: getTrace(req),
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
