const adminConsole = require('../controllers/admin-console.server.controller')
const spcp = require('../controllers/spcp.server.controller')
const myInfo = require('../controllers/myinfo.server.controller')
const admin = require('../controllers/admin-forms.server.controller')
const HttpStatus = require('http-status-codes')
const featureManager = require('../../config/feature-manager').default
const config = require('../../config/config')
const fs = require('fs')
const SPCPAuthClient = require('@opengovsg/spcp-auth-client')
const { MyInfoGovClient } = require('@opengovsg/myinfo-gov-client')
const MyInfoService = require('../services/myinfo.service')
const logger = require('../../config/logger').createLoggerWithLabel(
  'spcp-myinfo-config',
)

const spcpFactory = ({ isEnabled, props }) => {
  if (isEnabled && props) {
    logger.info('Configuring SingPass client...')
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
    logger.info('Configuring CorpPass client...')
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
    logger.info('Configuring MyInfo client...')
    let myInfoConfig = {
      realm: config.app.title,
      singpassEserviceId: props.spEsrvcId,
    }
    let myInfoGovClient
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
      logger.warn(
        `\n!!! WARNING !!!\nNo MyInfo keys detected.\nRequests to MyInfo will not work.\nThis should NEVER be seen in production.\nFalling back on MockPass.`,
      )
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
      encryptedVerifiedFields: spcp.encryptedVerifiedFields,
      passThroughSpcp: admin.passThroughSpcp,
      getLoginStats: adminConsole.getLoginStats,
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
      encryptedVerifiedFields: (req, res, next) => next(),
      passThroughSpcp: (req, res, next) => next(),
      getLoginStats: (req, res) =>
        res.send({
          loginStats: [],
        }),
      verifyMyInfoVals: (req, res, next) => next(),
      returnSpcpRedirectURL: (req, res) =>
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errMsg),
      singPassLogin: (req, res) =>
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errMsg),
      corpPassLogin: (req, res) =>
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errMsg),
      addSpcpSessionInfo: (req, res, next) => next(),
      isSpcpAuthenticated: (req, res, next) => next(),
      createSpcpRedirectURL: (req, res, next) => next(),
      addMyInfo: (req, res, next) => next(),
      validateESrvcId: (req, res) =>
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errMsg),
    }
  }
}

module.exports = spcpFactory(featureManager.get('spcp-myinfo'))
