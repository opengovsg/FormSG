'use strict'

const ejs = require('ejs')
const HttpStatus = require('http-status-codes')

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
    .status(HttpStatus.OK)
    .send(ejs.render(js, req.app.locals))
}

/**
 * Custom Javascript code templated with environment variables.
 * @returns {String} Templated Javascript code for the frontend
 */
module.exports.environment = function (req, res) {
  res
    .type('text/javascript')
    .status(HttpStatus.OK)
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
  res
    .type('text/javascript')
    .status(HttpStatus.OK)
    .send(ejs.render(js, req.query))
}
