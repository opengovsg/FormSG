'use strict'

/**
 * Module dependencies.
 */
const auth = require('../../app/controllers/authentication.server.controller')
const {
  AggregateStatsFactory,
} = require('../factories/aggregate-stats.factory')

module.exports = function (app) {
  /**
   * Lists publicly available forms that can be used as templates.
   * @route GET /examples
   * @group admin - form administration
   * @param {number} pageNo.query.required - Page number of results returned
   * @param {number} agency.query - _Id of agency to filter examples by
   * @param {String} searchTerm.query - Search term to match against example forms' title and instructions
   * @param {String} formId.query - Id of the form to retrieve
   * @produces application/json
   * @consumes application/json
   * @returns {Object|Array<Object>} 200 - A single form if formId is specified, or
   *                                       an array of forms to be listed on the examples page otherwise
   * @returns {string} 401 - authorization failure
   * @security OTP
   */
  app
    .route('/examples')
    .get(auth.authenticateUser, AggregateStatsFactory.getExampleForms)

  /**
   * Lists publicly available forms that can be used as templates.
   * @route GET /examples/:formId
   * @group admin - form administration
   * @param {number} pageNo.query.required - Page number of results returned
   * @param {number} agency.query - _Id of agency to filter examples by
   * @param {String} searchTerm.query - Search term to match against example forms' title and instructions
   * @param {String} formId.query - Id of the form to retrieve
   * @produces application/json
   * @consumes application/json
   * @returns {Object|Array<Object>} 200 - A single form if formId is specified, or
   *                                       an array of forms to be listed on the examples page otherwise
   * @returns {string} 401 - authorization failure
   * @security OTP
   */
  app
    .route('/examples/:formId([a-fA-F0-9]{24})')
    .get(auth.authenticateUser, AggregateStatsFactory.getSingleExampleForm)
}
