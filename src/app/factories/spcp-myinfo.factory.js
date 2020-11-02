const spcp = require('../controllers/spcp.server.controller')
const myInfo = require('../controllers/myinfo.server.controller')
const admin = require('../controllers/admin-forms.server.controller')
const { StatusCodes } = require('http-status-codes')
const featureManager = require('../../config/feature-manager').default
const config = require('../../config/config')
const fs = require('fs')
const SPCPAuthClient = require('@opengovsg/spcp-auth-client')
const { MyInfoGovClient } = require('@opengovsg/myinfo-gov-client')
const MyInfoService = require('../services/myinfo.service')
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
    let myInfoConfig = {
      realm: config.app.title,
      singpassEserviceId: props.spEsrvcId,
    }
    let myInfoGovClient
    // TODO: These env vars should move to spcp-myinfo.config and be validated
    // as part of convict (Issue #255)
    if (config.nodeEnv === 'production') {
      let myInfoPrefix =
        process.env.MYINFO_CLIENT_CONFIG === 'stg' ? 'STG2-' : 'PROD2-'
      myInfoConfig.privateKey = fs.readFileSync(
        process.env.MYINFO_FORMSG_KEY_PATH,
      )
      myInfoConfig.appId = myInfoPrefix + myInfoConfig.singpassEserviceId
      myInfoConfig.mode = process.env.MYINFO_CLIENT_CONFIG
      myInfoGovClient = new MyInfoGovClient(myInfoConfig)
    } else if (config.isDev && process.env.MYINFO_APP_KEY) {
      myInfoConfig.appId = 'STG2-' + myInfoConfig.singpassEserviceId
      myInfoConfig.privateKey = process.env.MYINFO_APP_KEY
      myInfoConfig.mode = 'stg'
      myInfoGovClient = new MyInfoGovClient(myInfoConfig)
    } else {
      logger.warn({
        message: `\n!!! WARNING !!!\nNo MyInfo keys detected.\nRequests to MyInfo will not work.\nThis should NEVER be seen in production.\nFalling back on MockPass.`,
        meta: {
          action: 'spcpFactory',
        },
      })
      myInfoConfig.appId = 'STG2-' + myInfoConfig.singpassEserviceId
      myInfoConfig.privateKey = fs.readFileSync(
        './node_modules/@opengovsg/mockpass/static/certs/key.pem',
      )
      myInfoConfig.mode = 'dev'
      myInfoGovClient = new MyInfoGovClient(myInfoConfig)
      myInfoGovClient.baseUrl = 'http://localhost:5156/myinfo/v2/'
    }
    let myInfoService = new MyInfoService(myInfoGovClient, props.spCookieMaxAge)

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
      getRequestedAttributes: spcp.getRequestedAttributes,
      appendVerifiedSPCPResponses: spcp.appendVerifiedSPCPResponses,
      passThroughSpcp: admin.passThroughSpcp,
      verifyMyInfoVals: myInfo.verifyMyInfoVals,
      returnSpcpRedirectURL: spcp.returnSpcpRedirectURL,
      singPassLogin: spcp.singPassLogin(ndiConfig),
      corpPassLogin: spcp.corpPassLogin(ndiConfig),
      addSpcpSessionInfo: spcp.addSpcpSessionInfo(authClients),
      isSpcpAuthenticated: spcp.isSpcpAuthenticated(authClients),
      createSpcpRedirectURL: spcp.createSpcpRedirectURL(authClients),
      addMyInfo: myInfo.addMyInfo(myInfoService),
      validateESrvcId: spcp.validateESrvcId,
    }
  } else {
    const errMsg = 'SPCP/MyInfo feature is not enabled'
    return {
      getRequestedAttributes: (req, res, next) => {
        res.locals.requestedAttributes = []
        return next()
      },
      appendVerifiedSPCPResponses: (req, res, next) => next(),
      passThroughSpcp: (req, res, next) => next(),
      verifyMyInfoVals: (req, res, next) => next(),
      returnSpcpRedirectURL: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: errMsg }),
      singPassLogin: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: errMsg }),
      corpPassLogin: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: errMsg }),
      addSpcpSessionInfo: (req, res, next) => next(),
      isSpcpAuthenticated: (req, res, next) => next(),
      createSpcpRedirectURL: (req, res, next) => next(),
      addMyInfo: (req, res, next) => next(),
      validateESrvcId: (req, res) =>
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: errMsg }),
    }
  }
}

module.exports = spcpFactory(featureManager.get('spcp-myinfo'))
