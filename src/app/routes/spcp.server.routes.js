'use strict'

const spcpFactory = require('../factories/spcp.factory')

/**
 * Module dependencies.
 */

module.exports = function (app) {
  /**
   * Receive a SAML artifact and target destination from CorpPass, and
   * issue a 302 redirect on successful artifact verification
   * @route GET /corppass/login
   * @group SPCP - SingPass/CorpPass logins for form-fillers
   * @param {string} SAMLart.query.required - the SAML artifact
   * @param {string} RelayState.query.required - the relative destination URL after login,
   * @returns {string} 302 - redirects the user to the specified relay state
   * @returns {string} 400 - received on a bad SAML artifact, or bad relay state
   * @headers {string} 302.jwtCp - contains the session cookie upon login
   * @headers {string} 302.isLoginError - true if we fail to obtain the user's identity
   */
  app.route('/corppass/login').get(spcpFactory.corpPassLogin)

  /**
   * Receive a SAML artifact and target destination from SingPass, and
   * issue a 302 redirect on successful artifact verification
   * @route GET /singpass/login
   * @group SPCP - SingPass/CorpPass logins for form-fillers
   * @param {string} SAMLart.query.required - the SAML artifact
   * @param {string} RelayState.query.required - the relative destination URL after login,
   * @returns {string} 302 - redirects the user to the specified relay state
   * @returns {string} 400 - received on a bad SAML artifact, or bad relay state
   * @headers {string} 302.jwtSp - contains the session cookie upon login
   * @headers {string} 302.isLoginError - true if we fail to obtain the user's identity
   */
  app.route('/singpass/login').get(spcpFactory.singPassLogin)
}
