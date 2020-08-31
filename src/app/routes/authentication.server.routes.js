'use strict'

/**
 * Module dependencies.
 */
const { StatusCodes } = require('http-status-codes')
const { celebrate, Joi } = require('celebrate')

let auth = require('../../app/controllers/authentication.server.controller')
const emailValOpts = {
  minDomainSegments: 2, // Number of segments required for the domain
  tlds: true, // TLD (top level domain) validation
  multiple: false, // Disallow multiple emails
}

module.exports = function (app) {
  /**
   * @typedef Email
   * @property {string} email.required - the user's email
   */

  /**
   * Check if email domain is a valid agency
   * @route POST /auth/checkuser
   * @group admin - form administration
   * @param {Email.model} email.body.required - the user's email
   * @produces application/json
   * @consumes application/json
   * @returns {Boolean} 200 - indicates if user has logged in before
   * @returns {string} 400 - a message indicating either a bad email address
   */
  app.route('/auth/checkuser').post(
    celebrate({
      body: Joi.object().keys({
        email: Joi.string()
          .required()
          .email(emailValOpts)
          .error(() => 'Please enter a valid email'),
      }),
    }),
    auth.validateDomain,
    (_, res) => res.sendStatus(StatusCodes.OK),
  )

  /**
   * Send a one-time password (OTP) to the specified email address
   * as part of login procedure
   * @route POST /auth/sendotp
   * @group admin - form administration
   * @param {Email.model} email.body.required - the user's email
   * @produces application/json
   * @consumes application/json
   * @returns {string} 200 - OTP has been been successfully sent
   * @returns {string} 400 - a message indicating either a bad email address, or that
   * the agency indicated in the email address has not been onboarded to FormSG
   * @returns {string} 500 - FormSG was unable to generate the OTP, or create or send
   * the email that delivers the OTP to the user's email address
   */
  app.route('/auth/sendotp').post(
    celebrate({
      body: Joi.object().keys({
        email: Joi.string()
          .required()
          .email(emailValOpts)
          .error(() => 'Please enter a valid email'),
      }),
    }),
    auth.validateDomain,
    auth.createOtp,
    auth.sendOtp,
  )

  /**
   * @typedef EmailAndOtp
   * @property {string} email.required - the user's email
   * @property {string} otp.required - the OTP provided by the user
   */

  /**
   * Verify the one-time password (OTP) for the specified email address
   * as part of login procedure
   * @route POST /auth/verifyotp
   * @group admin - form administration
   * @param {EmailAndOtp.model} email.body.required - the user's email and otp
   * @produces application/json
   * @consumes application/json
   * @returns {string} 200 - user has successfully logged in, with session cookie set
   * @returns {string} 400 - the OTP is invalid or has expired, or the email is invalid
   * @returns {string} 500 - FormSG was unable to verify the OTP
   * @headers {string} 200.set-cookie - contains the session cookie upon login
   */
  app.route('/auth/verifyotp').post(
    celebrate({
      body: Joi.object().keys({
        email: Joi.string()
          .required()
          .email(emailValOpts)
          .error(() => 'Please enter a valid email'),
        otp: Joi.string()
          .required()
          .regex(/^\d{6}$/)
          .error(() => 'Please enter a valid otp'),
      }),
    }),
    auth.validateDomain,
    auth.verifyOtp,
    auth.signIn,
  )

  /**
   * Sign the user out of the session by clearing the relevant session cookie
   * @route GET /auth/signout
   * @group admin - form administration
   * @produces application/json
   * @returns {string} 200 - user has signed out
   * @returns {string} 400 - the signout failed for one reason or another
   */
  app.route('/auth/signout').get(auth.signOut)
}
