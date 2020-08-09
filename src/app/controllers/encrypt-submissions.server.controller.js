'use strict'
const crypto = require('crypto')
const moment = require('moment-timezone')
const JSONStream = require('JSONStream')
const HttpStatus = require('http-status-codes')

const mongoose = require('mongoose')
const errorHandler = require('./errors.server.controller')
const {
  getEncryptSubmissionModel,
} = require('../models/submission.server.model')
const getSubmissionModel = require('../models/submission.server.model').default
const Submission = getSubmissionModel(mongoose)
const encryptSubmission = getEncryptSubmissionModel(mongoose)

const { checkIsEncryptedEncoding } = require('../utils/encryption')
const { getParsedResponses } = require('../utils/response')
const { ConflictError } = require('../utils/custom-errors')
const { getRequestIp } = require('../utils/request')
const { isMalformedDate, createQueryWithDateParam } = require('../utils/date')
const logger = require('../../config/logger').createLoggerWithLabel(
  'encrypt-submissions',
)
const {
  aws: { attachmentS3Bucket, s3 },
} = require('../../config/config')

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
    logger.error(
      `Error 400 - Invalid encryption: formId=${form._id} ip=${getRequestIp(
        req,
      )} error='${error}'`,
    )
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send({ message: 'Invalid data was found. Please submit again.' })
  }

  if (req.body.responses) {
    try {
      const encryptModeFilter = (arr) =>
        arr.filter(({ fieldType }) => ['mobile', 'email'].includes(fieldType)) // For autoreplies
      req.body.parsedResponses = getParsedResponses(
        form,
        req.body.responses,
        encryptModeFilter,
      )
      delete req.body.responses // Prevent downstream functions from using responses by deleting it
    } catch (err) {
      logger.error(`ip="${getRequestIp(req)}" error=`, err)
      if (err instanceof ConflictError) {
        return res.status(HttpStatus.CONFLICT).send({
          message:
            'The form has been updated. Please refresh and submit again.',
        })
      } else {
        return res.status(HttpStatus.BAD_REQUEST).send({
          message:
            'There is something wrong with your form submission. Please check your responses and try again. If the problem persists, please refresh the page.',
        })
      }
    }
    return next()
  } else {
    return res.sendStatus(HttpStatus.BAD_REQUEST)
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
  logger.error(getRequestIp(req), req.url, req.headers, err)
  return res.status(HttpStatus.BAD_REQUEST).send({
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
          logger.error('Attachment upload error: ', err)
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
  let { page, filterBySubmissionRefId } = req.query || {}
  let numToSkip = parseInt(page - 1 || 0) * pageSize

  let matchClause = {
    form: req.form._id,
    submissionType: 'encryptSubmission',
  }

  if (filterBySubmissionRefId) {
    if (mongoose.Types.ObjectId.isValid(filterBySubmissionRefId)) {
      matchClause._id = mongoose.Types.ObjectId(filterBySubmissionRefId)
    } else {
      return res.status(HttpStatus.OK).send({ metadata: [], count: 0 })
    }
  }

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
        logger.error(getRequestIp(req), req.url, req.headers, err)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
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
        return res.status(HttpStatus.OK).send({ metadata, count })
      }
    })
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
      logger.error(getRequestIp(req), req.url, req.headers, err)
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
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
    return res.status(HttpStatus.BAD_REQUEST).send({
      message: 'Malformed date parameter',
    })
  }

  let query = {
    form: req.form._id,
    submissionType: 'encryptSubmission',
  }

  query = createQueryWithDateParam(query, req)

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
      logger.error(
        `Error streaming submissions from MongoDB:\t ip=${getRequestIp(req)}`,
        err,
      )
      res.status(500).send({
        message: 'Error retrieving from database.',
      })
    })
    // If you call JSONStream.stringify(false) the elements will only be
    // seperated by a newline.
    .pipe(JSONStream.stringify(false))
    .on('error', function (err) {
      logger.error(
        `Error converting submissions to JSON:\t ip=${getRequestIp(req)}`,
        err,
      )
      res.status(500).send({
        message: 'Error converting submissions to JSON',
      })
    })
    .pipe(res.type('application/x-ndjson'))
    .on('error', function (err) {
      logger.error(
        `Error writing submissions to HTTP stream:\t ip=${getRequestIp(req)}`,
        err,
      )
      res.status(500).send({
        message: 'Error writing submissions to HTTP stream',
      })
    })
    .on('end', function () {
      res.end()
    })
}
