'use strict'

const mongoose = require('mongoose')
const { StatusCodes } = require('http-status-codes')

const { getRequestIp, getTrace } = require('../utils/request')
const RateLimit = require('express-rate-limit')
const { merge } = require('lodash')
const logger = require('../../config/logger').createLoggerWithLabel(module)
const getFormFeedbackModel = require('../models/form_feedback.server.model')
  .default
const getFormModel = require('../models/form.server.model').default
const FormFeedback = getFormFeedbackModel(mongoose)
const Form = getFormModel(mongoose)

/**
 * Checks if form is public
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Object} next - Express next middleware function
 */
exports.isFormPublic = function (req, res, next) {
  switch (req.form.status) {
    case 'PUBLIC':
      return next()
    case 'ARCHIVED':
      return res.sendStatus(StatusCodes.GONE)
    default:
      return res.status(StatusCodes.NOT_FOUND).send({
        message: req.form.inactiveMessage,
        isPageFound: true, // Flag to prevent default 404 subtext ("please check link") from showing
        formTitle: req.form.title,
      })
  }
}

/**
 * Used to redirect forms without hashbang to that with hashbang
 * This allows form links to be free of hashbangs and can thus be shared
 * via QR codes or url shorteners. Also handles requests from web crawlers
 * for the generation of rich link previews, renders index with the relevant
 * metatags if a crawler's user agent string is detected.
 * @param  {Object} req - Express request object
 * @param {String} req.params.Id - id of the form being accessed
 * @param {String} req.params.state - state of the req (preview, template or use-template)
 * @param  {Object} res - Express response object
 */
exports.redirect = async function (req, res) {
  let redirectPath = req.params.state
    ? req.params.Id + '/' + req.params.state
    : req.params.Id
  try {
    const metaTags = await fetchMetatags(req)
    return res.render('index', {
      ...metaTags,
      redirectPath,
    })
  } catch (err) {
    logger.error({
      message: 'Error fetching metatags',
      meta: {
        action: 'redirect',
        trace: getTrace(req),
      },
      error: err,
    })
  }
  res.redirect('/#!/' + redirectPath)
}

/**
 * Submit feedback from form to our DB,
 * to be analysed in analytics in the future.
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 */
exports.submitFeedback = function (req, res) {
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
  }

  FormFeedback.create(
    {
      formId: req.params.formId,
      rating: req.body.rating,
      comment: req.body.comment,
    },
    function (err) {
      if (err) {
        logger.error({
          message: 'Error creating form feedback',
          meta: {
            action: 'submitFeedback',
            ip: getRequestIp(req),
            trace: getTrace(req),
          },
          error: err,
        })
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send('Form feedback could not be created')
      } else {
        return res
          .status(StatusCodes.OK)
          .send('Successfully submitted feedback')
      }
    },
  )
}

/**
 * Returns a middleware which logs a message if the rate of requests
 * to an API endpoint exceeds a given rate.
 * TODO (private #49): update this documentation.
 * @param {RateLimit.Options} options Custom options to be passed to RateLimit
 * @return {RateLimit.RateLimit} Rate-limiting middleware
 */
exports.limitRate = function (options = {}) {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 3,
    handler: (req, _res, next) => {
      logger.warn({
        message: 'Rate limit exceeded',
        meta: {
          action: 'limitRate',
          url: req.url,
          method: req.method,
          rateLimitInfo: req.rateLimit,
        },
      })
      // TODO (private #49): terminate the request with 429
      return next()
    },
  }
  return RateLimit(merge(defaultOptions, options))
}

/**
 * Fetches the form object and the form details are used to populate the page's metatags.
 * @param {Object} req
 * @param {String} req.params.id - id of the form
 * @param {String} req.protocol - whether it's using http or https
 * @param {String} req.host - the host/domain of the request
 * @returns {Object} containing the form details that will be used in the page metatags
 */
const fetchMetatags = async function (req) {
  const result = await Form.findById(req.params.Id)
  const baseUrl = req.protocol + '://' + req.get('host')
  const fullUrl = baseUrl + req.originalUrl
  const metaTags = {
    title: result.title,
    description: result.startPage.paragraph,
    appUrl: fullUrl,
    images: `${baseUrl}/public/modules/core/img/og/img_metatag.png, ${baseUrl}/public/modules/core/img/og/logo-vertical-color.png`.split(
      ',',
    ),
    twitterImage: `${baseUrl}/public/modules/core/img/og/logo-vertical-color.png`,
  }
  return metaTags
}
