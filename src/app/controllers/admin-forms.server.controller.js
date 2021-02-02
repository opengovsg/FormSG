'use strict'

/**
 * Module dependencies.
 */
const mongoose = require('mongoose')
const _ = require('lodash')
const { StatusCodes } = require('http-status-codes')

const logger = require('../../config/logger').createLoggerWithLabel(module)
const errorHandler = require('../utils/handle-mongo-error')
const { createReqMeta } = require('../utils/request')

const { EditFieldActions } = require('../../shared/constants')
const getSubmissionModel = require('../models/submission.server.model').default

// Export individual functions (i.e. create, delete)
// and makeModule function that takes in connection object
module.exports = _.assign({ makeModule }, makeModule(mongoose))

/**
 * Packages functions in module that can accept a db connection
 * @param  {Object} connection - DB connection instance
 * @return  {Object} functions - admin controller functions
 */
function makeModule(connection) {
  /**
   * @deprecated
   * Note that this function has already been refactored in transformMongoError
   * in handle-mongo-error.ts. This function remains for Javascript controllers
   * without mapRouteErrors.
   *
   * Helper function that handles responding to a client request
   * when encountering a MongoDB error.
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @param {MongoError} err A Mongoose error from a callback
   * @param {String} err.name Name of Mongoose error
   * @param {Number} err.code MongoDB error code
   */
  function respondOnMongoError(req, res, err) {
    if (err) {
      logger.error({
        message: 'Responding to Mongo error',
        meta: {
          action: 'respondOnMongoError',
          ...createReqMeta(req),
        },
        error: err,
      })

      let statusCode
      if (err.name === 'ValidationError') {
        statusCode = StatusCodes.UNPROCESSABLE_ENTITY
      } else if (err.name === 'VersionError') {
        statusCode = StatusCodes.CONFLICT
      } else if (
        err.name === 'FormSizeError' || // FormSG-imposed limit in pre-validate hook
        err instanceof RangeError || // exception when Mongoose breaches Mongo 16MB size limit
        (err.name === 'MongoError' && err.code === 10334) // MongoDB Invalid BSON error
      ) {
        statusCode = StatusCodes.REQUEST_TOO_LONG // HTTP 413 Payload Too Large
      } else {
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR
      }

      return res.status(statusCode).json({
        message: errorHandler.getMongoErrorMessage(err),
      })
    }
  }

  /**
   *
   * Add, delete, update or reorder a form field at a particular position.
   *
   * @param {Array} formFields formFields from existing form
   * @param {Object} editFormField information about the form field to be edited
   * @param {String} editFormField.action.name name of action to be taken; one of CREATE|REORDER|UPDATE|DELETE
   * @param {Number} [editFormField.action.position] optional unless action.name === REORDER. integer indicating position to reorder field to
   * @param {Object} editFormField.field the field to be created,reordered,updated,or deleted.
   * @returns
   */
  function getEditedFormFields(formFields, editFormField) {
    const { field, action } = editFormField
    if (_.isEmpty(field)) {
      return { error: 'Invalid update to form - field is missing' }
    }

    const errorMsg = `Invalid update to form, globalId for field is ${field.globalId}`

    // Find existing form field
    const existingFieldPosition = formFields.findIndex(
      (f) => f.globalId === field.globalId,
    )

    const actionNameString = String(action.name)

    switch (actionNameString) {
      case EditFieldActions.Create:
        if (existingFieldPosition !== -1) {
          return { error: `${errorMsg} - field to be created already exists` }
        }
        formFields.push(field)
        break
      case EditFieldActions.Duplicate:
        if (existingFieldPosition !== -1) {
          return {
            error: `${errorMsg} - field to be duplicated already exists`,
          }
        }
        formFields.push(field)
        break
      case EditFieldActions.Reorder: {
        if (existingFieldPosition === -1) {
          return { error: `${errorMsg} - field to be reordered does not exist` }
        }

        const { position } = action
        if (position === undefined || position === null) {
          return {
            error: `${errorMsg} - position to reorder field to does not exist`,
          }
        }
        // Remove existing field
        formFields.splice(existingFieldPosition, 1)
        // Add field at position
        formFields.splice(position, 0, field)
        break
      }
      case EditFieldActions.Update:
        if (existingFieldPosition === -1) {
          return { error: `${errorMsg} - field to be updated does not exist` }
        }
        formFields[existingFieldPosition] = field
        break
      case EditFieldActions.Delete:
        if (existingFieldPosition === -1) {
          return { error: `${errorMsg} - field to be deleted does not exist` }
        }
        formFields.splice(existingFieldPosition, 1) // Deletes inplace
        break
      default:
        return { error: `${errorMsg} - action is not recognized` }
    }
    return { formFields }
  }

  return {
    /**
     * Checks if form is active
     * @param  {Object} req - Express request object
     * @param  {Object} res - Express response object
     * @param  {Object} next - Express next middleware function
     */
    isFormActive: function (req, res, next) {
      if (req.form.status === 'ARCHIVED') {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Form has been archived',
        })
      } else {
        return next()
      }
    },
    /**
     * Ensures form is encrypt mode
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param  {Object} next - Express next middleware function
     */
    isFormEncryptMode: function (req, res, next) {
      if (req.form.responseMode !== 'encrypt') {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
          message: 'Form is not encrypt mode',
        })
      }
      return next()
    },
    /**
     * Updates a form from Settings tab
     * @param  {Object} req - Express request object
     * @param  {Object} res - Express response object
     */
    update: function (req, res) {
      // form is retrieved from formById and updatedForm is passed to us from frontend
      let form = req.form
      let updatedForm = req.body.form

      // Admin from frontend has to be deleted because it contains populated agency
      delete updatedForm.admin
      delete updatedForm.__v
      delete updatedForm._id
      delete updatedForm.id
      delete updatedForm.created
      delete updatedForm.lastModified
      delete form.__v
      delete form.created
      delete form.lastModified

      if (!_.isEmpty(updatedForm.editFormField)) {
        if (!_.isEmpty(updatedForm.form_fields)) {
          // form_fields should not exist in updatedForm
          logger.error({
            message: 'form_fields should not exist in updatedForm',
            meta: {
              action: 'makeModule.update',
              ...createReqMeta(req),
              formId: form._id,
            },
          })
          return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ message: 'Invalid update to form' })
        } else {
          const { error, formFields } = getEditedFormFields(
            _.cloneDeep(form.form_fields),
            updatedForm.editFormField,
          )
          if (error) {
            logger.error({
              message: 'Error getting edited form fields',
              meta: {
                action: 'makeModule.update',
                ...createReqMeta(req),
                formId: form._id,
              },
              error,
            })
            return res.status(StatusCodes.BAD_REQUEST).json({ message: error })
          }
          form.form_fields = formFields
          delete updatedForm.editFormField
        }
      }

      _.merge(form, updatedForm)

      // Can't just do updatedForm.save() because updatedForm has some String values
      form.save(function (err, savedForm) {
        if (err) return respondOnMongoError(req, res, err)
        return res.json(savedForm)
      })
    },
    /**
     * Submit feedback when previewing forms
     * Preview feedback is not stored
     * @param  {Object} req - Express request object
     * @param  {Object} res - Express response object
     */
    passThroughFeedback: function (req, res) {
      if (
        !req.params ||
        !('formId' in req.params) ||
        !req.body ||
        !('rating' in req.body) ||
        !('comment' in req.body)
      ) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: 'Form feedback data not passed in' })
      } else {
        return res
          .status(StatusCodes.OK)
          .json({ message: 'Successfully received feedback' })
      }
    },
    /**
     * Pass through save new Submission object to db
     * Simply create and pass forward a submissions object w/o saving to db
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Object} next - the next expressjs callback
     */
    passThroughSaveMetadataToDb: function (req, res, next) {
      let Submission = getSubmissionModel(connection)
      let submission = new Submission({})
      req.submission = submission
      return next()
    },
  }
}
