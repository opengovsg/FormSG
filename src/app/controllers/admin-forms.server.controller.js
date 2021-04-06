'use strict'

/**
 * Module dependencies.
 */
const mongoose = require('mongoose')
const _ = require('lodash')
const { StatusCodes } = require('http-status-codes')

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
