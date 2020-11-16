const spcp = require('../controllers/spcp.server.controller')
const admin = require('../controllers/admin-forms.server.controller')
const { StatusCodes } = require('http-status-codes')
const featureManager = require('../../config/feature-manager').default
const fs = require('fs')
const SPCPAuthClient = require('@opengovsg/spcp-auth-client')
const logger = require('../../config/logger').createLoggerWithLabel(module)

const spcpFactory = ({ isEnabled, props }) => {
  if (isEnabled && props) {
    logger.info({
      message: 'Configuring SingPass client...',
      meta: {
        action: 'spcpFactory',
      },
    })
    let singPassAuthClient = new SPCPAuthClient({
      partnerEntityId: props.spPartnerEntityId,
      idpLoginURL: props.spIdpLoginUrl,
      idpEndpoint: props.spIdpEndpoint,
      esrvcID: props.spEsrvcId,
      appKey: fs.readFileSync(props.spFormSgKeyPath),
      appCert: fs.readFileSync(props.spFormSgCertPath),
      spcpCert: fs.readFileSync(props.spIdpCertPath),
      extract: SPCPAuthClient.extract.SINGPASS,
    })
    logger.info({
      message: 'Configuring CorpPass client...',
      meta: {
        action: 'spcpFactory',
      },
    })
    let corpPassAuthClient = new SPCPAuthClient({
      partnerEntityId: props.cpPartnerEntityId,
      idpLoginURL: props.cpIdpLoginUrl,
      idpEndpoint: props.cpIdpEndpoint,
      esrvcID: props.cpEsrvcId,
      appKey: fs.readFileSync(props.cpFormSgKeyPath),
      appCert: fs.readFileSync(props.cpFormSgCertPath),
      spcpCert: fs.readFileSync(props.cpIdpCertPath),
      extract: SPCPAuthClient.extract.CORPPASS,
    })
    logger.info({
      message: 'Configuring MyInfo client...',
      meta: {
        action: 'spcpFactory',
      },
    })

    const authClients = {
      SP: singPassAuthClient,
      CP: corpPassAuthClient,
    }

    const ndiConfig = {
      authClients,
      cpCookieMaxAge: props.cpCookieMaxAge,
      spCookieMaxAgePreserved: props.spCookieMaxAgePreserved,
      spCookieMaxAge: props.spCookieMaxAge,
      spcpCookieDomain: props.spcpCookieDomain,
      idpPartnerEntityIds: {
        SP: props.spIdpId,
        CP: props.cpIdpId,
      },
    }

    return {
      appendVerifiedSPCPResponses: spcp.appendVerifiedSPCPResponses,
      passThroughSpcp: admin.passThroughSpcp,
      returnSpcpRedirectURL: spcp.returnSpcpRedirectURL,
      singPassLogin: spcp.singPassLogin(ndiConfig),
      corpPassLogin: spcp.corpPassLogin(ndiConfig),
      addSpcpSessionInfo: spcp.addSpcpSessionInfo(authClients),
      isSpcpAuthenticated: spcp.isSpcpAuthenticated(authClients),
      createSpcpRedirectURL: spcp.createSpcpRedirectURL(authClients),
      validateESrvcId: spcp.validateESrvcId,
    }
  } else {
    const errMsg = 'SPCP/MyInfo feature is not enabled'
    return {
      appendVerifiedSPCPResponses: (req, res, next) => next(),
      passThroughSpcp: (req, res, next) => next(),
      returnSpcpRedirectURL: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: errMsg }),
      singPassLogin: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: errMsg }),
      corpPassLogin: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: errMsg }),
      addSpcpSessionInfo: (req, res, next) => next(),
      isSpcpAuthenticated: (req, res, next) => next(),
      createSpcpRedirectURL: (req, res, next) => next(),
      validateESrvcId: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: errMsg }),
    }
  }
}

module.exports = spcpFactory(featureManager.get('spcp-myinfo'))
