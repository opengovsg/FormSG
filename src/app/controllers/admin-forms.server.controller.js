'use strict'

/**
 * Module dependencies.
 */
const mongoose = require('mongoose')
const moment = require('moment-timezone')
const _ = require('lodash')
const JSONStream = require('JSONStream')
const { StatusCodes } = require('http-status-codes')
const get = require('lodash/get')

const logger = require('../../config/logger').createLoggerWithLabel(module)
const errorHandler = require('./errors.server.controller')
const { getRequestIp } = require('../utils/request')
const { FormLogoState } = require('../../types')

const {
  aws: { imageS3Bucket, logoS3Bucket, logoBucketUrl, s3 },
} = require('../../config/config')
const {
  VALID_UPLOAD_FILE_TYPES,
  MAX_UPLOAD_FILE_SIZE,
  EditFieldActions,
} = require('../../shared/constants')
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
          ip: getRequestIp(req),
          url: req.url,
          headers: req.headers,
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

      return res.status(statusCode).send({
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
        return res.status(StatusCodes.NOT_FOUND).send({
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
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).send({
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
        return res.status(StatusCodes.BAD_REQUEST).send({
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
              ip: getRequestIp(req),
              formId: form._id,
            },
          })
          return res
            .status(StatusCodes.BAD_REQUEST)
            .send({ message: 'Invalid update to form' })
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
                ip: getRequestIp(req),
                formId: form._id,
              },
              error,
            })
            return res.status(StatusCodes.BAD_REQUEST).send({ message: error })
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
            .send({ message: 'Form not found for duplication' })
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
     * List of all of user-created (and collaborated-on) forms
     * @param  {Object} req - Express request object
     * @param  {Object} res - Express response object
     */
    list: function (req, res) {
      let Form = getFormModel(connection)
      // List forms when either the user is an admin or collaborator
      let searchFields = [
        { 'permissionList.email': req.session.user.email },
        { admin: req.session.user },
      ]
      let returnedFields = '_id title admin lastModified status form_fields'

      Form.find({ $or: searchFields }, returnedFields)
        .sort('-lastModified')
        .populate({
          path: 'admin',
          populate: {
            path: 'agency',
          },
        })
        .exec(function (err, forms) {
          if (err) {
            return respondOnMongoError(req, res, err)
          } else if (!forms) {
            return res.status(StatusCodes.NOT_FOUND).send({
              message: 'No user-created and collaborated-on forms found',
            })
          }
          let activeForms = forms.filter((form) => form.status !== 'ARCHIVED')
          return res.json(activeForms)
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
            .send({ message: 'No feedback found' })
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
     * Count number of form feedbacks for Feedback tab
     * @param  {Object} req - Express request object
     * @param  {Object} req.form - the form to download
     * @param  {Object} res - Express response object
     */
    countFeedback: function (req, res) {
      let FormFeedback = getFormFeedbackModel(connection)
      FormFeedback.countDocuments({ formId: req.form._id }, function (
        err,
        count,
      ) {
        if (err) {
          logger.error({
            message: 'Error counting documents in FormFeedback',
            meta: {
              action: 'makeModule.countFeedback',
              ip: getRequestIp(req),
              url: req.url,
              headers: req.headers,
            },
            error: err,
          })
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
            message: errorHandler.getMongoErrorMessage(err),
          })
        } else {
          return res.json(count)
        }
      })
    },
    /**
     * Stream download feedback for a form
     * @param  {Object} req - Express request object
     * @param  {Object} req.form - the form to download
     * @param  {Object} res - Express response object
     */
    streamFeedback: function (req, res) {
      let FormFeedback = getFormFeedbackModel(connection)
      FormFeedback.find({ formId: req.form._id })
        .cursor()
        .on('error', function (err) {
          logger.error({
            message: 'Error streaming feedback from MongoDB',
            meta: {
              action: 'makeModule.streamFeedback',
              ip: getRequestIp(req),
            },
            error: err,
          })
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
            message: 'Error retrieving from database.',
          })
        })
        .pipe(JSONStream.stringify())
        .on('error', function (err) {
          logger.error({
            message: 'Error converting feedback to JSON',
            meta: {
              action: 'makeModule.streamFeedback',
              ip: getRequestIp(req),
            },
            error: err,
          })
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
            message: 'Error converting feedback to JSON',
          })
        })
        .pipe(res.type('json'))
        .on('error', function (err) {
          logger.error({
            message: 'Error writing feedback to HTTP stream',
            meta: {
              action: 'makeModule.streamFeedback',
              ip: getRequestIp(req),
            },
            error: err,
          })
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
            message: 'Error writing feedback to HTTP stream',
          })
        })
        .on('end', function () {
          res.end()
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
          .send('Form feedback data not passed in')
      } else {
        return res.status(StatusCodes.OK).send('Successfully received feedback')
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
    /**
     * Allow submission in preview without Spcp authentication by providing default values
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Object} next - the next expressjs callback
     */
    passThroughSpcp: function (req, res, next) {
      const { authType } = req.form
      switch (authType) {
        case 'SP': {
          res.locals.uinFin = 'S1234567A'
          req.hashedFields = {}
          let actualFormFields = req.form.form_fields
          let actualMyInfoFields = actualFormFields.filter(
            (field) => field.myInfo && field.myInfo.attr,
          )
          for (let field of actualMyInfoFields) {
            req.hashedFields[field.myInfo.attr] = true
          }
          break
        }
        case 'CP':
          res.locals.uinFin = '123456789A'
          res.locals.userInfo = 'ABC'
          break
        default:
          break
      }
      return next()
    },
    /**
     * Return presigned post data of S3 bucket image
     * @param {Object} req - Express request object
     * @param {String} req.body.fileId - Name of the file to save. Is somewhat unique (see frontend code)
     * @param {String} req.body.fileMd5Hash - MD5 hash of the file to save. To ensure file is not corrupted while uploading
     * @param {String} req.body.fileType - Mime type of the file to save. To enforce file format
     * @param {Object} res - Express response object
     */
    createPresignedPostForImages: function (req, res) {
      if (!VALID_UPLOAD_FILE_TYPES.includes(req.body.fileType)) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .send(`Your file type "${req.body.fileType}" is not supported`)
      }

      s3.createPresignedPost(
        {
          Bucket: imageS3Bucket,
          Expires: 900, // Expires in 15 mins
          Conditions: [
            ['content-length-range', 0, MAX_UPLOAD_FILE_SIZE], // content length restrictions: 0-MAX_UPLOAD_FILE_SIZE
          ],
          Fields: {
            acl: 'public-read',
            key: req.body.fileId,
            'Content-MD5': req.body.fileMd5Hash,
            'Content-Type': req.body.fileType,
          },
        },
        function (err, presignedPostObject) {
          if (err) {
            logger.error({
              message: 'Presigning post data encountered an error',
              meta: {
                action: 'makeModule.streamFeedback',
                ip: getRequestIp(req),
              },
              error: err,
            })
            return res.status(StatusCodes.BAD_REQUEST).send(err)
          } else {
            return res.status(StatusCodes.OK).send(presignedPostObject)
          }
        },
      )
    },

    /**
     * Return presigned post data of logo S3 bucket
     * @param {Object} req - Express request object
     * @param {String} req.body.fileId - Name of the file to save. Is somewhat unique (see frontend code)
     * @param {String} req.body.fileMd5Hash - MD5 hash of the file to save. To ensure file is not corrupted while uploading
     * @param {String} req.body.fileType - Mime type of the file to save. To enforce file format
     * @param {Object} res - Express response object
     */
    createPresignedPostForLogos: function (req, res) {
      if (!VALID_UPLOAD_FILE_TYPES.includes(req.body.fileType)) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .send(`Your file type "${req.body.fileType}" is not supported`)
      }

      s3.createPresignedPost(
        {
          Bucket: logoS3Bucket,
          Expires: 900, // Expires in 15 mins
          Conditions: [
            ['content-length-range', 0, MAX_UPLOAD_FILE_SIZE], // content length restrictions: 0-MAX_UPLOAD_FILE_SIZE
          ],
          Fields: {
            acl: 'public-read',
            key: req.body.fileId,
            'Content-MD5': req.body.fileMd5Hash,
            'Content-Type': req.body.fileType,
          },
        },
        function (err, presignedPostObject) {
          if (err) {
            logger.error({
              message: 'Presigning post data encountered an error',
              meta: {
                action: 'makeModule.streamFeedback',
                ip: getRequestIp(req),
              },
              error: err,
            })
            return res.status(StatusCodes.BAD_REQUEST).send(err)
          } else {
            return res.status(StatusCodes.OK).send(presignedPostObject)
          }
        },
      )
    },
  }
}
