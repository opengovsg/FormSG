'use strict'

const bcrypt = require('bcrypt')
const crypto = require('crypto')
const CircuitBreaker = require('opossum')
const to = require('await-to-js').default
const Promise = require('bluebird')
const _ = require('lodash')
const mongoose = require('mongoose')
const moment = require('moment')
const { StatusCodes } = require('http-status-codes')

const { sessionSecret } = require('../../config/config')
const { createReqMeta } = require('../utils/request')
const logger = require('../../config/logger').createLoggerWithLabel(module)
const getMyInfoHashModel = require('../models/myinfo_hash.server.model').default
const MyInfoHash = getMyInfoHashModel(mongoose)

/**
 * Adds MyInfo data to response, if form-filler is authenticated with Singpass.
 * Otherwise, do nothing and forward the request.
 * @param {import ('../services/myinfo.service')} myInfoService
 */
exports.addMyInfo = (myInfoService) => async (req, res, next) => {
  // Convert form from mongoose document to object so we can edit it
  req.form = req.form.toJSON()
  const { spcpSession } = res.locals
  const { esrvcId, authType, form_fields: formFields, _id: formId } = req.form

  // Early return if nothing needs to be done.
  if (!spcpSession || authType !== 'SP') {
    return next()
  }

  const requestedAttributes = formFields
    .filter((field) => field.myInfo && field.myInfo.attr)
    .map((field) => field.myInfo.attr)

  // Early return if no attributes are requested.
  if (requestedAttributes.length === 0) {
    return next()
  }

  const uinFin = spcpSession.userName
  const [fetchError, myInfoData] = await to(
    myInfoService.fetchMyInfoPersonData({
      uinFin,
      requestedAttributes,
      singpassEserviceId: esrvcId,
    }),
  )
  if (fetchError) {
    const logMessage = CircuitBreaker.isOurError(fetchError)
      ? 'Circuit breaker tripped'
      : 'Error retrieving from MyInfo'
    logger.error({
      message: logMessage,
      meta: {
        action: 'addMyInfo',
        ...createReqMeta(req),
        formId,
        esrvcId,
      },
      error: fetchError,
    })
    res.locals.myInfoError = true
    return next()
  }

  // Retrieve data for the next steps.
  const {
    prefilledFields,
    readOnlyHashPromises,
  } = myInfoService.prefillMyInfoFields(myInfoData, formFields)

  // Set current form fields to the new prefilledFields.
  req.form.form_fields = prefilledFields

  const hashedUinFin = crypto
    .createHmac('sha256', sessionSecret)
    .update(uinFin)
    .digest('hex')

  Promise.props(readOnlyHashPromises)
    .then((readOnlyHashes) => {
      // Add to DB only if uinFin-form combo not already present
      let filter = {
        uinFin: hashedUinFin,
        form: formId,
      }
      MyInfoHash.findOneAndUpdate(
        filter,
        {
          $set: _.extend(
            {
              fields: readOnlyHashes,
              expireAt: Date.now() + myInfoService.spCookieMaxAge,
            },
            filter,
          ),
        },
        {
          upsert: true,
        },
        (err) => {
          if (err) {
            res.locals.myInfoError = true
            logger.error({
              message: 'Error writing to DB',
              meta: {
                action: 'addMyInfo',
                ...createReqMeta(req),
                formId,
              },
              error: err,
            })
          }
          return next()
        },
      )
    })
    .catch((error) => {
      logger.error({
        message: 'Error hashing MyInfo fields',
        meta: {
          action: 'addMyInfo',
          ...createReqMeta(req),
          formId,
        },
        error,
      })
      res.locals.myInfoError = true
      return next()
    })
}

/**
 * Intercept the field value of a submitted form before performing hash
 * checking, and transform it if necessary.
 *
 * E.g. Date fields are submitted as '1974-05-11T00:00:00.000Z' but hashed as
 * '1974-05-11'.
 * @param  {Object} field A field element from form_fields array
 * @return {Object}       An object keyed by field attribute containing value
 * for performing hash checking with.
 */
function _preHashCheckConversion(field) {
  let fieldValue = field.fieldValue || field.answer
  fieldValue =
    field.fieldType === 'date'
      ? moment(new Date(fieldValue)).format('YYYY-MM-DD')
      : fieldValue

  return {
    attr: field.myInfo.attr,
    val: fieldValue,
  }
}

/**
 * Verifies that myInfo vals from client match hash in DB
 * @param  {Object} req - Express request object
 * @param  {Object} req.form - Form retrieved from database
 * @param  {Object} req.form.authType - Middleware operates only on 'SP' forms
 * @param  {Object} req.form.form_fields - Fields defining form
 * @param  {Object} req.body - Contains key-value pairs of data submitted in the request body
 * @param  {Object} req.body.parsedResponses - Parsed responses from submissions server controller
 * @param  {Object} res - Express response object
 * @param  {Object} res.locals - Express response local variables scoped to the request
 * @param  {Object} res.locals.uinFin - UIN/FIN of form submitter
 * @param  {Object} next - Express next middleware function
 */
exports.verifyMyInfoVals = function (req, res, next) {
  const { authType } = req.form
  const actualMyInfoFields = req.form.form_fields.filter(
    (field) => field.myInfo && field.myInfo.attr,
  )
  if (authType === 'SP' && actualMyInfoFields.length > 0) {
    const uinFin = res.locals.uinFin
    const formObjId = req.form._id

    let hashedUinFin = crypto
      .createHmac('sha256', sessionSecret)
      .update(uinFin)
      .digest('hex')
    MyInfoHash.findOne(
      { uinFin: hashedUinFin, form: formObjId },
      (err, hashedObj) => {
        if (err) {
          logger.error({
            message: 'Error retrieving MyInfo hash from database',
            meta: {
              action: 'verifyMyInfoVals',
              ...createReqMeta(req),
            },
            error: err,
          })
          return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
            message: 'MyInfo verification unavailable, please try again later.',
            spcpSubmissionFailure: true,
          })
        }

        if (!hashedObj) {
          logger.error({
            message: `Unable to find MyInfo hashes for ${formObjId}`,
            meta: {
              action: 'verifyMyInfoVals',
              ...createReqMeta(req),
              formId: formObjId,
            },
          })
          return res.status(StatusCodes.GONE).json({
            message:
              'MyInfo verification expired, please refresh and try again.',
            spcpSubmissionFailure: true,
          })
        }
        // Fields from client submission
        let clientFormFields = req.body.parsedResponses // responses were transformed in submissions.server.controller.js
        let clientMyInfoFields = clientFormFields
          .filter(
            (field) => field.isVisible && field.myInfo && field.myInfo.attr,
          )
          .map(_preHashCheckConversion)

        // Fields from saved hash
        let hashedFields = hashedObj.fields
        // compare hashed values to submission values
        const bcryptCompares = clientMyInfoFields.map((clientField) => {
          const expected = hashedFields[clientField.attr]
          return expected
            ? bcrypt.compare(clientField.val, expected)
            : Promise.resolve(true)
        })
        Promise.all(bcryptCompares)
          .then((compare) => {
            return {
              compare, // Array<Boolean> indicating hash pass/fail
              fail: compare.some((v) => !v), // Whether any hashes failed
            }
          })
          .then((hashResults) => {
            if (hashResults.fail) {
              // Array of MyInfo attributes that failed verification
              let hashFailedAttrs = _.zip(
                clientMyInfoFields,
                hashResults.compare,
              )
                .filter(([_, compare]) => compare === false)
                .map(([clientField, _]) => clientField.attr)

              logger.error({
                message: `Hash did not match for form ${formObjId}`,
                meta: {
                  action: 'verifyMyInfoVals',
                  ...createReqMeta(req),
                  failedFields: hashFailedAttrs,
                },
              })
              return res.status(StatusCodes.UNAUTHORIZED).json({
                message: 'MyInfo verification failed.',
                spcpSubmissionFailure: true,
              })
            } else {
              let verifiedKeys = _.intersection(
                _.uniq(clientMyInfoFields.map((field) => field.attr)),
                _.keys(hashedFields),
              )
              req.hashedFields = _.pick(hashedFields, verifiedKeys)
              return next()
            }
          })
      },
    )
  } else {
    return next()
  }
}
