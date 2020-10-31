'use strict'

const spcpFactory = require('../factories/spcp.factory')

/**
 * Module dependencies.
 */

module.exports = function (app) {
  /**
   * @typedef RedirectURL
   * @property {string} redirectURL.required - the SingPass/CorpPass IDP URL to redirect to
   */

  /**
   * Provide a URL that web agents are obliged to redirect users to.
   * Due to cross-origin restrictions in place by SingPass/CorpPass,
   * this endpoint cannot and should not issue a 302 redirect
   * @route GET /spcp/redirect
   * @group SPCP - SingPass/CorpPass logins for form-fillers
   * @param {string} target.query.required - the destination URL after login
   * @param {string} authType.query.required - `SP` for SingPass or `CP` for CorpPass
   * @param {string} esrvcId.query.required - e-service id
   * @produces application/json
   * @returns {RedirectURL.model} 200 - contains the URL to redirect to
   * @returns {string} 400 - the redirect URL will be malformed due to missing parameters
   */
  app
    .route('/spcp/redirect')
    .get(spcpFactory.createSpcpRedirectURL, spcpFactory.returnSpcpRedirectURL)

  /**
   * Gets the spcp redirect URL and parses the returned page to check for error codes
   * @route GET /spcp/validate
   * @group SPCP - SingPass/CorpPass logins for form-fillers
   * @param {string} target.query.required - the destination URL after login
   * @param {string} authType.query.required - `SP` for SingPass or `CP` for CorpPass
   * @param {string} esrvcId.query.required - e-service id
   * @produces application/json
   * @returns {Object} 200 - {status: boolean} where boolean is true if eservice id was valid, false otherwise
   * @returns {string} 400 - the redirect URL will be malformed due to missing parameters
   */
  app
    .route('/spcp/validate')
    .get(spcpFactory.createSpcpRedirectURL, spcpFactory.validateESrvcId)

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
