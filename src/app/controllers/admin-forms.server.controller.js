'use strict'

/**
 * Module dependencies.
 */
const mongoose = require('mongoose')
const moment = require('moment-timezone')
const _ = require('lodash')
const { StatusCodes } = require('http-status-codes')

const logger = require('../../config/logger').createLoggerWithLabel(module)
const errorHandler = require('../utils/handle-mongo-error')
const { createReqMeta } = require('../utils/request')
const { FormLogoState } = require('../../types')

const {
  aws: { logoBucketUrl },
} = require('../../config/config')
const { EditFieldActions } = require('../../shared/constants')
const {
  getEncryptedFormModel,
  getEmailFormModel,
} = require('../models/form.server.model')
const getFormModel = require('../models/form.server.model').default
const getFormFeedbackModel = require('../models/form_feedback.server.model')
  .default
const getSubmissionModel = require('../models/submission.server.model').default
const { ResponseMode } = require('../../types')

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
   * Get the model depending on responseMode
   * @param {*} responseMode
   * @returns the encryptSchema Form if responseMode is 'encrypt' else emailSchema Form
   */
  function getDiscriminatedFormModel(responseMode) {
    return responseMode === ResponseMode.Encrypt
      ? getEncryptedFormModel(connection)
      : getEmailFormModel(connection)
  }

  /**
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
   * Mutates customLogo in form to keep it in sync with changes to logo
   *
   * @param {Object} form object to be saved to form collection
   * @returns {Object} form
   */
  function updateCustomLogoInForm(form) {
    const logo = _.get(form, 'startPage.logo', null)
    if (logo) {
      switch (logo.state) {
        case FormLogoState.None:
          form.customLogo = ''
          break
        case FormLogoState.Default:
          form.customLogo = undefined
          break
        case FormLogoState.Custom:
          if (logo.fileId) {
            form.customLogo = `${logoBucketUrl}/${logo.fileId}`
          } else {
            logger.error({
              message: `Logo is in an invalid state. fileId should always be defined for CUSTOM state but is ${logo.fileId} for form ${form._id}`,
              meta: {
                action: 'updateCustomLogoInForm',
              },
            })
          }
          break
        default:
          logger.error({
            message: `logo is in an invalid state. Only NONE, DEFAULT and CUSTOM are allowed but state is ${logo.state} for form ${form._id}`,
            meta: {
              action: 'updateCustomLogoInForm',
            },
          })
      }
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
     * Create a new form called on list forms
     * @param  {Object} req - Express request object
     * @param  {Object} res - Express response object
     */
    create: function (req, res) {
      if (!req.body.form) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Invalid Input',
        })
      }
      let Form = getDiscriminatedFormModel(req.body.form.responseMode)
      let form = new Form(req.body.form)

      form.admin = req.session.user._id

      form.save(function (err) {
        if (err) return respondOnMongoError(req, res, err)
        return res.json(form)
      })
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

      // Log updates to customLogo so that we know when admin clients are no longer updating customLogo
      if (
        updatedForm.customLogo !== undefined &&
        form.customLogo !== updatedForm.customLogo
      ) {
        logger.info({
          message: `Custom logo being updated for form ${form._id}`,
          meta: {
            action: 'makeModule.update',
          },
        })
      }

      _.extend(form, updatedForm)

      // Updates to logo should also update customLogo (to account for clients still referencing customLogo)
      // TODO: Remove once all forms have logo key and customLogo is removed from schema
      updateCustomLogoInForm(form)

      // Can't just do updatedForm.save() because updatedForm has some String values
      form.save(function (err, savedForm) {
        if (err) return respondOnMongoError(req, res, err)
        return res.json(savedForm)
      })
    },
    /**
     * Deletes a form from list forms page (no delete on view form)
     * @param  {Object} req - Express request object
     * @param  {Object} res - Express response object
     */
    delete: function (req, res) {
      let form = req.form
      // Set form to inactive
      form.status = 'ARCHIVED'
      form.save(function (err, savedForm) {
        if (err) {
          return respondOnMongoError(req, res, err)
        }
        return res.json(savedForm)
      })
    },
    /**
     * Duplicates an entire form from list forms page
     * Duplicating non-admin form, makes you admin of duplicated form
     * @param  {Object} req - Express request object
     * @param  {Object} res - Express response object
     */
    duplicate: function (req, res) {
      let Form = getFormModel(connection)
      let id = req.form._id
      Form.findById({ _id: id }).exec(function (err, form) {
        if (err) {
          return respondOnMongoError(req, res, err)
        } else if (!form) {
          return res
            .status(StatusCodes.NOT_FOUND)
            .json({ message: 'Form not found for duplication' })
        } else {
          let responseMode = req.body.responseMode || 'email'
          // Custom properties on the new form
          const overrideProps = {
            responseMode,
            admin: req.session.user._id,
            title: req.body.title,
            isNew: true,
          }
          if (responseMode === 'encrypt') {
            overrideProps.publicKey = req.body.publicKey
          } else {
            if (req.body.emails) {
              overrideProps.emails = req.body.emails
            }
          }
          if (req.body.isTemplate) {
            overrideProps.customLogo = undefined
          }

          // Prevent buttonLink from being copied over if same as formHash (for old forms)
          if (form.endPage && form.endPage.buttonLink) {
            let oldFormHash = '#!/' + id
            if (form.endPage.buttonLink === oldFormHash) {
              overrideProps.endPage = form.endPage
              delete overrideProps.endPage.buttonLink
            }
          }

          const onError = (error) => respondOnMongoError(req, res, error)

          const onSuccess = (successForm) => {
            let formFields = successForm.getMainFields()
            // Have to set admin here if not duplicated form will
            // not be admin before refresh
            formFields.admin = req.session.user
            return res.json(formFields)
          }

          const DiscriminatedForm = getDiscriminatedFormModel(responseMode)
          const discriminatedForm = new DiscriminatedForm(
            form.duplicate(overrideProps),
          )
          discriminatedForm.save(function (sErr, duplicated) {
            return sErr ? onError(sErr) : onSuccess(duplicated)
          })
        }
      })
    },
    /**
     * Return form feedback matching query
     * @param  {Object} req - Express request object
     * @param  {Object} res - Express response object
     */
    getFeedback: function (req, res) {
      let FormFeedback = getFormFeedbackModel(connection)
      let query = FormFeedback.find({ formId: req.form._id }).sort({
        created: 1,
      })
      query.exec(function (err, feedback) {
        if (err) {
          return respondOnMongoError(req, res, err)
        } else if (!feedback) {
          return res
            .status(StatusCodes.NOT_FOUND)
            .json({ message: 'No feedback found' })
        } else {
          let sum = 0
          let count = 0
          feedback = feedback.map(function (element) {
            sum += element.rating
            count += 1
            return {
              index: count,
              timestamp: moment(element.created).valueOf(),
              rating: element.rating,
              comment: element.comment,
              date: moment(element.created)
                .tz('Asia/Singapore')
                .format('D MMM YYYY'),
              dateShort: moment(element.created)
                .tz('Asia/Singapore')
                .format('D MMM'),
            }
          })
          let average = count > 0 ? (sum / count).toFixed(2) : undefined
          return res.json({
            average: average,
            count: count,
            feedback: feedback,
          })
        }
      })
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

    /**
     * Transfer a form to another user
     * @param  {Object} req - Express request object
     * @param  {Object} res - Express response object
     */
    transferOwner: async function (req, res) {
      const newOwnerEmail = req.body.email

      // Transfer owner and Save the form
      try {
        await req.form.transferOwner(req.session.user, newOwnerEmail)
      } catch (err) {
        logger.error({
          message: err.message,
          meta: {
            action: 'makeModule.transferOwner',
            ...createReqMeta(req),
          },
          err,
        })
        return res.status(StatusCodes.CONFLICT).json({ message: err.message })
      }
      req.form.save(function (err, savedForm) {
        if (err) return respondOnMongoError(req, res, err)
        savedForm.populate('admin', (err) => {
          if (err) return respondOnMongoError(req, res, err)
          return res.json({ form: savedForm })
        })
      })
    },
  }
}
