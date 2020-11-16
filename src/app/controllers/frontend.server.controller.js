'use strict'

const ejs = require('ejs')
const { StatusCodes } = require('http-status-codes')

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
  res
    .type('text/javascript')
    .status(StatusCodes.OK)
    .send(ejs.render(js, req.app.locals))
}

/**
 * Custom Javascript code templated with environment variables.
 * @returns {String} Templated Javascript code for the frontend
 */
module.exports.environment = function (req, res) {
  res
    .type('text/javascript')
    .status(StatusCodes.OK)
    .send(req.app.locals.environment)
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
  const ejsRendered = ejs.render(js, req.query).replace(/&amp;/g, '&')
  res.type('text/javascript').status(StatusCodes.OK).send(ejsRendered)
}
