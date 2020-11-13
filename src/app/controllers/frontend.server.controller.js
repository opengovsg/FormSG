'use strict'

const ejs = require('ejs')
const { StatusCodes } = require('http-status-codes')
const logger = require('../../config/logger').createLoggerWithLabel(module)
const { createReqMeta } = require('../utils/request')

/**
 * Google Tag Manager initialisation Javascript code templated
 * with environment variables.
 * @returns {String} Templated Javascript code for the frontend
 */
module.exports.datalayer = function (req, res) {
  const js = `
    window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '<%= GATrackingID%>', {
        'send_page_view': false,
        'app_name': '<%= appName%>'
      });
    `
  try {
    const ejsRendered = ejs.render(js, req.app.locals)
    res.type('text/javascript').status(StatusCodes.OK).send(ejsRendered)
  } catch (err) {
    logger.error({
      message: 'Error returning datalayer',
      meta: {
        action: 'ejs.render(js, req.app.locals)',
        ...createReqMeta(req),
      },
      error: err,
    })
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'There was an unexpected error. Please refresh and try again.',
    })
  }
}

/**
 * Custom Javascript code templated with environment variables.
 * @returns {String} Templated Javascript code for the frontend
 */
module.exports.environment = function (req, res) {
  try {
    res
      .type('text/javascript')
      .status(StatusCodes.OK)
      .send(req.app.locals.environment)
  } catch (err) {
    logger.error({
      message: 'Error returning environment',
      meta: {
        action: 'res.send(req.app.locals.environment',
        ...createReqMeta(req),
      },
      error: err,
    })
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'There was an unexpected error. Please refresh and try again.',
    })
  }
}

/**
 * Custom Javascript code that redirects to specific form url
 * @returns {String} Templated Javascript code for the frontend
 */
module.exports.redirectLayer = function (req, res) {
  const js = `
    // Update hash to match form id
    window.location.hash = "#!/<%= redirectPath%>"
    // Change url from form.gov.sg/123#!123 to form.gov.sg/#!/123
    window.history.replaceState("","", "/#!/<%= redirectPath%>")
  `
  // If there are multiple query params, '&' is html-encoded as '&amp;', which is not valid URI
  // Prefer to replace just '&' instead of using <%- to output unescaped values into the template
  // As this could potentially introduce security vulnerability
  // See https://ejs.co/#docs for tags

  try {
    const ejsRendered = ejs.render(js, req.query).replace(/&amp;/g, '&')
    res.type('text/javascript').status(StatusCodes.OK).send(ejsRendered)
  } catch (err) {
    logger.error({
      message: 'Error returning redirectLayer',
      meta: {
        action: 'ejs.render(js, req.query)',
        ...createReqMeta(req),
      },
      error: err,
    })
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'There was an unexpected error. Please refresh and try again.',
    })
  }
}
