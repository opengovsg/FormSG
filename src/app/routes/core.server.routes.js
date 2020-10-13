'use strict'

/**
 * Module dependencies.
 */
let core = require('../../app/controllers/core.server.controller')

module.exports = function (app) {
  // Core routing
  app.route('/').get(core.index)
}
