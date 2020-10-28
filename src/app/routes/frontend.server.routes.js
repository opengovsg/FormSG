'use strict'

const frontendCtrl = require('../controllers/frontend.server.controller')
const featureManager = require('../../config/feature-manager').default
const googleAnalyticsFactory = require('../factories/google-analytics.factory')
const { celebrate, Joi, Segments } = require('celebrate')

module.exports = function (app) {
  app.route('/frontend/datalayer').get(googleAnalyticsFactory.datalayer)

  app.route('/frontend/environment').get(frontendCtrl.environment)

  app.route('/frontend/redirect').get(
    celebrate({
      [Segments.QUERY]: {
        redirectPath: Joi.string()
          .regex(
            /^[a-fA-F0-9]{24}(\/(preview|template|use-template))?(\?([0-9A-Za-z]+=[0-9A-Za-z]+)(&[0-9A-Za-z]+=[0-9A-Za-z]+)*)?$/,
          )
          .required(),
      },
    }),
    frontendCtrl.redirectLayer,
  )

  app.route('/frontend/features').get((req, res) => {
    res.json(featureManager.states)
  })
}
