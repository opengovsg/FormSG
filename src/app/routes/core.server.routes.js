'use strict'

/**
 * Module dependencies.
 */
let core = require('../../app/controllers/core.server.controller')
const aggregStatsFactory = require('../factories/aggregate-stats.factory')

module.exports = function (app) {
  // Core routing
  app.route('/').get(core.index)

  /**
   * Retrieves the number of popular forms on FormSG
   * @route GET /analytics/forms
   * @group analytics - form usage statistics
   * @produces application/json
   * @returns {Number} 200 - the number of forms with more than 10 submissions
   */
  app.route('/analytics/forms').get(aggregStatsFactory.formCount)

  /**
   * Retrieves the number of users building forms on FormSG
   * @route GET /analytics/users
   * @group analytics - form usage statistics
   * @produces application/json
   * @returns {Number} 200 - the number of users building forms
   */
  app.route('/analytics/users').get(core.userCount)

  /**
   * Retrieves the total number of submissions of forms across FormSG
   * @route GET /analytics/submissions
   * @group analytics - form usage statistics
   * @produces application/json
   * @returns {Number} 200 - the total number of submissions of forms
   */
  app.route('/analytics/submissions').get(core.submissionCount)
}
