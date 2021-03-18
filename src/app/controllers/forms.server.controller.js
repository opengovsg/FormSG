'use strict'

/**
 * Module dependencies.
 */
const mongoose = require('mongoose')
const _ = require('lodash')
const { StatusCodes } = require('http-status-codes')

const { createReqMeta } = require('../utils/request')
const logger = require('../../config/logger').createLoggerWithLabel(module)
const getFormModel = require('../models/form.server.model').default
const { IntranetFactory } = require('../services/intranet/intranet.factory')
const { getRequestIp } = require('../utils/request')
const { AuthType } = require('../../types')

const Form = getFormModel(mongoose)

/**
 * @typedef {string} RequestType
 */

/**
 * @enum {RequestType}
 */
const requestTypes = {
  ADMIN: 'ADMIN',
  PUBLIC: 'PUBLIC',
}
exports.REQUEST_TYPE = requestTypes

const adminPublicFields = ['agency']
const adminPrivateFields = ['email', 'betaFlags']
const formPublicFields = [
  'admin',
  'authType',
  'endPage',
  'esrvcId',
  'form_fields',
  'form_logics',
  'hasCaptcha',
  'publicKey',
  'startPage',
  'status',
  'title',
  '_id',
  'responseMode',
]

/**
 * Shows the current form. If the form is for public use, more extensive scrubbing of admin details is carried out.
 * @param {RequestType} requestType - Whether this request is for admin use or public use of a form
 * @returns {function({Object}, {Object})} - A function that takes req, the express request object, and
 *   res, the express response object.
 */
exports.read = (requestType) =>
  /**
   * ! Note that this function should not call any mongoose functions on req.form as it is possibly already a plain JSON object.
   * Takes the form and replaces admin details with agency details, as well as scrubbing the form if the
   * request is not for admin purposes.
   * @param  {Object} req - Express request object
   * @param  {Object} req.form - The form from the DB that was retrieved from a previous middleware function
   * @param  {Object} res - Express response object
   */
  (req, res) => {
    let form = req.form
    let spcpSession = res.locals.spcpSession || {}
    let myInfoError = res.locals.myInfoError

    // Remove sensitive admin details
    const adminFields = adminPublicFields.concat(
      requestType === requestTypes.ADMIN && adminPrivateFields,
    )
    form.admin = _.pick(form.admin, adminFields)

    // For non-admin forms, we have more extensive scrubbing of irrelevant fields
    if (requestType !== requestTypes.ADMIN) {
      form = _.pick(form, formPublicFields)
    }

    const isIntranetResult = IntranetFactory.isIntranetIp(getRequestIp(req))
    let isIntranetUser = false
    if (isIntranetResult.isOk()) {
      isIntranetUser = isIntranetResult.value
    }

    // SP, CP and MyInfo are not available on intranet
    if (
      isIntranetUser &&
      [AuthType.SP, AuthType.CP, AuthType.MyInfo].includes(form.authType)
    ) {
      logger.warn({
        message:
          'Attempting to access SingPass, CorpPass or MyInfo form from intranet',
        meta: {
          action: 'read',
          formId: form._id,
        },
      })
    }

    return res.json({
      form,
      spcpSession,
      myInfoError,
      isIntranetUser,
    })
  }

/**
 *    Form middleware used to set form in the request after
 *    grabbing it from MongoDB
 *    @param  {Object} req - Express request object
 *    @param  {Object} res - Express response object
 *    @param  {Object} next - Express next middleware function
 *    @param  {Object} id - Form ID
 *    @return {Void}
 */
exports.formById = async function (req, res, next) {
  let id = req.params && req.params.formId

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Form URL is invalid.',
    })
  }
  try {
    const form = await Form.getFullFormById(id)
    if (!form) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Oops! We can't find the form you're looking for.",
      })
    } else {
      // Remove sensitive information from User object
      if (!form.admin) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Server error.',
        })
      }
      req.form = form
      return next()
    }
  } catch (err) {
    logger.error({
      message: 'Error retrieving form from database',
      meta: {
        action: 'formById',
        ...createReqMeta(req),
      },
      error: err,
    })
    return next(err)
  }
}
