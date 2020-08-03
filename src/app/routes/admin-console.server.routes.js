'use strict'

/**
 * Module dependencies.
 */
const auth = require('../../app/controllers/authentication.server.controller')
const { celebrate, Joi } = require('celebrate')
const aggregStatsFactory = require('../factories/aggregate-stats.factory')
const spcpFactory = require('../factories/spcp-myinfo.factory')

module.exports = function (app) {
  /**
   * Lists the SingPass/CorpPass (SPCP) logins made to forms
   * created by the user's agency, serving as the basis for billing
   * @route GET /billing
   * @group admin - form administration
   * @param {string} esrvcId.query.required - esrvcId to search for
   * @param {number} yr.query.required - the year of the month
   * @param {number} mth.query.required - the month itself
   * @produces application/json
   * @consumes application/json
   * @returns {Array} 200 - An array of SPCP logins made to fill
   * forms owned by the user's agency, ie, what the user's agency
   * will be billed for
   * @returns {string} 401 - authorization failure
   * @security OTP
   */
  app.route('/billing').get(
    celebrate({
      query: Joi.object({
        esrvcId: Joi.string().required(),
        yr: Joi.number().integer().min(2019).required(),
        mth: Joi.number().integer().min(0).max(11).required(),
      }),
    }),
    auth.authenticateUser,
    spcpFactory.getLoginStats,
  )

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
    .get(auth.authenticateUser, aggregStatsFactory.getExampleForms)

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
    .get(auth.authenticateUser, aggregStatsFactory.getSingleExampleForm)
}
