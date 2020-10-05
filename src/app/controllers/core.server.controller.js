const mongoose = require('mongoose')
const _ = require('lodash')
const { StatusCodes } = require('http-status-codes')

const config = require('../../config/config')
const { getRequestIp, getTrace } = require('../utils/request')
const logger = require('../../config/logger').createLoggerWithLabel(module)

const getFormStatisticsTotalModel = require('../models/form_statistics_total.server.model')
  .default
const getSubmissionModel = require('../models/submission.server.model').default
const getUserModel = require('../models/user.server.model').default

const FormStatisticsTotal = getFormStatisticsTotalModel(mongoose)
const Submission = getSubmissionModel(mongoose)

const MIN_SUB_COUNT = 10 // minimum number of submissions before search is returned

/**
 * Renders root: '/'
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.index = function (req, res) {
  res.render('index', {
    user: JSON.stringify(req.session.user) || 'null',
  })
}

/**
 * Returns # forms that have > 10 responses using aggregate collection
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.formCountUsingAggregateCollection = (req, res) => {
  FormStatisticsTotal.aggregate(
    [
      {
        $match: {
          totalCount: {
            $gt: MIN_SUB_COUNT,
          },
        },
      },
      {
        $count: 'numActiveForms',
      },
    ],
    function (err, [result]) {
      if (err) {
        logger.error({
          message: 'Mongo form statistics aggregate error',
          meta: {
            action: 'formCountUsingAggregateCollection',
            ip: getRequestIp(req),
            trace: getTrace(req),
            url: req.url,
            headers: req.headers,
          },
          error: err,
        })
        res.sendStatus(StatusCodes.SERVICE_UNAVAILABLE)
      } else if (result) {
        res.json(_.get(result, 'numActiveForms', 0))
      } else {
        res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR)
      }
    },
  )
}

/**
 * Returns # forms that have > 10 responses using submissions collection
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.formCountUsingSubmissionsCollection = (req, res) => {
  Submission.aggregate(
    [
      {
        $group: {
          _id: '$form',
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: {
            $gt: MIN_SUB_COUNT,
          },
        },
      },
    ],
    function (err, forms) {
      if (err) {
        logger.error({
          message: 'Mongo submission aggregate error',
          meta: {
            action: 'formCountUsingSubmissionsCollection',
            ip: getRequestIp(req),
            trace: getTrace(req),
            url: req.url,
            headers: req.headers,
          },
          error: err,
        })
        res.sendStatus(StatusCodes.SERVICE_UNAVAILABLE)
      } else {
        res.json(forms.length)
      }
    },
  )
}

/**
 * Returns total number of users
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.userCount = (req, res) => {
  let User = getUserModel(mongoose)
  User.estimatedDocumentCount(function (err, ct) {
    if (err) {
      logger.error({
        message: 'Mongo user count error',
        meta: {
          action: 'userCount',
          ip: getRequestIp(req),
          trace: getTrace(req),
          url: req.url,
          headers: req.headers,
        },
        error: err,
      })
    } else {
      res.json(ct)
    }
  })
}

/**
 * Returns total number of form submissions
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.submissionCount = (req, res) => {
  let Submission = getSubmissionModel(mongoose)
  Submission.estimatedDocumentCount(function (err, ct) {
    if (err) {
      logger.error({
        message: 'Mongo submission count error',
        meta: {
          action: 'submissionCount',
          ip: getRequestIp(req),
          trace: getTrace(req),
          url: req.url,
          headers: req.headers,
        },
        error: err,
      })
    } else {
      let totalCount = ct + config.submissionsTopUp
      res.json(totalCount)
    }
  })
}
