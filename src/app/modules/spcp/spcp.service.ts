import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import axios from 'axios'
import fs from 'fs'
import { StatusCodes } from 'http-status-codes'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import {
  FormAuthType,
  PublicFormAuthValidateEsrvcIdDto,
} from '../../../../shared/types'
import {
  ISpcpMyInfo,
  spcpMyInfoConfig,
} from '../../config/features/spcp-myinfo.config'
import { createLoggerWithLabel } from '../../config/logger'
import { ApplicationError } from '../core/core.errors'

import {
  CreateRedirectUrlError,
  FetchLoginPageError,
  InvalidJwtError,
  InvalidOOBParamsError,
  LoginPageValidationError,
  MissingAttributesError,
  MissingJwtError,
  RetrieveAttributesError,
  VerifyJwtError,
} from './spcp.errors'
import {
  CorppassAttributes,
  CorppassJwtPayloadFromCookie,
  JwtName,
  JwtPayload,
  JwtPayloadFromCookie,
  ParsedSpcpParams,
  PublicJwk,
  SingpassAttributes,
  SingpassJwtPayloadFromCookie,
  SpcpCookies,
  SpcpDomainSettings,
} from './spcp.types'
import {
  extractFormId,
  getAttributesPromise,
  getSubstringBetween,
  isCorppassJwtPayload,
  isSingpassJwtPayload,
  isValidAuthenticationQuery,
  verifyJwtPromise,
} from './spcp.util'

const logger = createLoggerWithLabel(module)

const LOGIN_PAGE_HEADERS =
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3'
const LOGIN_PAGE_TIMEOUT = 10000 // 10 seconds

/**
 * Class for executing Singpass/Corppass-related services.
 * Exported for testing.
 */
export class SpcpServiceClass {
  #singpassAuthClient: SPCPAuthClient
  #corppassAuthClient: SPCPAuthClient
  #spcpProps: ISpcpMyInfo

  constructor(props: ISpcpMyInfo) {
    this.#spcpProps = props
    this.#singpassAuthClient = new SPCPAuthClient({
      partnerEntityId: props.spPartnerEntityId,
      idpLoginURL: props.spIdpLoginUrl,
      idpEndpoint: props.spIdpEndpoint,
      esrvcID: props.spEsrvcId,
      appKey: fs.readFileSync(props.spFormSgKeyPath),
      appCert: fs.readFileSync(props.spFormSgCertPath),
      spcpCert: fs.readFileSync(props.spIdpCertPath),
      extract: SPCPAuthClient.extract.SINGPASS,
    })
    this.#corppassAuthClient = new SPCPAuthClient({
      partnerEntityId: props.cpPartnerEntityId,
      idpLoginURL: props.cpIdpLoginUrl,
      idpEndpoint: props.cpIdpEndpoint,
      esrvcID: props.cpEsrvcId,
      appKey: fs.readFileSync(props.cpFormSgKeyPath),
      appCert: fs.readFileSync(props.cpFormSgCertPath),
      spcpCert: fs.readFileSync(props.cpIdpCertPath),
      extract: SPCPAuthClient.extract.CORPPASS,
    })
  }

  /**
   * Retrieve the correct auth client.
   * @param authType 'SP' or 'CP'
   */
  getAuthClient(authType: FormAuthType.SP | FormAuthType.CP): SPCPAuthClient {
    if (authType === FormAuthType.SP) {
      return this.#singpassAuthClient
    } else {
      return this.#corppassAuthClient
    }
  }

  /**
   * Create the URL to which the client should be redirected for Singpass/
   * Corppass login.
   * @param authType 'SP' or 'CP'
   * @param target The target URL which will become the SPCP RelayState
   * @param esrvcId SP/CP e-service ID
   */
  createRedirectUrl(
    authType: FormAuthType.SP | FormAuthType.CP,
    target: string,
    esrvcId: string,
  ): Result<string, CreateRedirectUrlError> {
    const logMeta = {
      action: 'createRedirectUrl',
      authType,
      target,
      esrvcId,
    }
    const authClient = this.getAuthClient(authType)
    const result = authClient.createRedirectURL(target, esrvcId)
    if (typeof result === 'string') {
      return ok(result)
    } else {
      logger.error({
        message: 'Error while creating redirect URL',
        meta: logMeta,
        error: result,
      })
      return err(new CreateRedirectUrlError())
    }
  }

  /**
   * Fetches the HTML of the given URL.
   * @param redirectUrl URL from which to obtain the HTML
   */
  fetchLoginPage(
    redirectUrl: string,
  ): ResultAsync<string, FetchLoginPageError> {
    return ResultAsync.fromPromise(
      axios
        .get<string>(redirectUrl, {
          headers: {
            Accept: LOGIN_PAGE_HEADERS,
          },
          timeout: LOGIN_PAGE_TIMEOUT,
          // Throw error if not status 200.
          validateStatus: (status) => status === StatusCodes.OK,
        })
        .then((response) => response.data),
      (error) => {
        logger.error({
          message: 'Error while fetching SP/CP login page',
          meta: {
            action: 'fetchLoginPage',
            redirectUrl,
          },
          error,
        })
        return new FetchLoginPageError()
      },
    )
  }

  /**
   * Validates that the login page does not have an error.
   * @param loginHtml The HTML of the page to validate
   */
  validateLoginPage(
    loginHtml: string,
  ): Result<PublicFormAuthValidateEsrvcIdDto, LoginPageValidationError> {
    // The successful login page should have the title 'SingPass Login'
    // The error page should have the title 'SingPass - System Error Page'
    const title = getSubstringBetween(loginHtml, '<title>', '</title>')
    // Check for non-existence of title. Empty string is ok.
    if (title === null) {
      logger.error({
        message: 'Could not find SP/CP login page title',
        meta: {
          action: 'validateLoginPage',
          loginHtml,
        },
      })
      return err(new LoginPageValidationError())
    }
    if (title.toLowerCase().indexOf('error') === -1) {
      return ok({ isValid: true })
    } else {
      // The error page should have text like 'System Code:&nbsp<b>138</b>'
      const errorCode = getSubstringBetween(
        loginHtml.toLowerCase(),
        'system code:&nbsp;<b>',
        '</b>',
      )
      logger.warn({
        message: 'Received error page from SP/CP',
        meta: {
          action: 'validateLoginPage',
          errorCode,
        },
      })
      return ok({ isValid: false, errorCode })
    }
  }

  /**
   * Extracts the SP or CP JWT from an object containing cookies
   * @param cookies Object containing cookies
   * @param authType 'SP' or 'CP'
   */
  extractJwt(
    cookies: SpcpCookies,
    authType: FormAuthType.SP | FormAuthType.CP,
  ): Result<string, MissingJwtError> {
    const jwtName = authType === FormAuthType.SP ? JwtName.SP : JwtName.CP
    const cookie = cookies[jwtName]
    return cookie ? ok(cookie) : err(new MissingJwtError())
  }

  /**
   * Verifies a Singpass JWT and extracts its payload.
   * @param jwt The contents of the JWT cookie
   */
  extractSingpassJwtPayload(
    jwt: string,
  ): ResultAsync<
    SingpassJwtPayloadFromCookie,
    VerifyJwtError | InvalidJwtError
  > {
    const logMeta = {
      action: 'extractSingpassJwtPayload',
    }
    const authClient = this.getAuthClient(FormAuthType.SP)
    return ResultAsync.fromPromise(
      verifyJwtPromise(authClient, jwt),
      (error) => {
        logger.error({
          message: 'Failed to verify JWT with auth client',
          meta: logMeta,
          error,
        })
        return new VerifyJwtError()
      },
    ).andThen((payload) => {
      if (isSingpassJwtPayload(payload)) {
        return okAsync(payload)
      }
      const payloadIsDefined = !!payload
      const payloadKeys =
        typeof payload === 'object' && !!payload && Object.keys(payload)
      logger.error({
        message: 'JWT has incorrect shape',
        meta: {
          ...logMeta,
          payloadIsDefined,
          payloadKeys,
        },
      })
      return errAsync(new InvalidJwtError())
    })
  }

  /**
   * Verifies a Corppass JWT and extracts its payload.
   * @param jwt The contents of the JWT cookie
   */
  extractCorppassJwtPayload(
    jwt: string,
  ): ResultAsync<
    CorppassJwtPayloadFromCookie,
    VerifyJwtError | InvalidJwtError
  > {
    const logMeta = {
      action: 'extractCorppassJwtPayload',
    }
    const authClient = this.getAuthClient(FormAuthType.CP)
    return ResultAsync.fromPromise(
      verifyJwtPromise(authClient, jwt),
      (error) => {
        logger.error({
          message: 'Failed to verify JWT with auth client',
          meta: logMeta,
          error,
        })
        return new VerifyJwtError()
      },
    ).andThen((payload) => {
      if (isCorppassJwtPayload(payload)) {
        return okAsync(payload)
      }
      const payloadIsDefined = !!payload
      const payloadKeys =
        typeof payload === 'object' && !!payload && Object.keys(payload)
      logger.error({
        message: 'JWT has incorrect shape',
        meta: {
          ...logMeta,
          payloadIsDefined,
          payloadKeys,
        },
      })
      return errAsync(new InvalidJwtError())
    })
  }

  /**
   * Parses raw SAML artifact and relay state.
   * @param samlArt SAML artifact
   * @param relayState Relay parameters passed back by SP/CP server
   * @param authType 'SP' or 'CP'
   * @return Parsed form ID, destination, rememberMe setting, cookie duration and SAML artifact
   */
  parseOOBParams(
    samlArt: string,
    relayState: string,
    authType: FormAuthType.SP | FormAuthType.CP,
  ): Result<ParsedSpcpParams, InvalidOOBParamsError> {
    const logMeta = {
      action: 'validateOOBParams',
      relayState,
      samlArt,
      authType,
    }
    const payloads = relayState.split(',')
    const formId = extractFormId(payloads[0])
    if ((payloads.length !== 2 && payloads.length !== 3) || !formId) {
      logger.error({
        message: 'RelayState incorrectly formatted',
        meta: logMeta,
      })
      return err(new InvalidOOBParamsError())
    }

    const rememberMe = payloads[1] === 'true'
    const encodedQuery = payloads.length === 3 ? payloads[2] : ''
    let decodedQuery = ''

    try {
      decodedQuery = encodedQuery
        ? `?${Buffer.from(encodedQuery, 'base64').toString('utf8')}`
        : ''
    } catch (e) {
      logger.error({
        message: 'Unable to decode encodedQuery',
        meta: {
          action: 'parseOOBParams',
          encodedQuery,
        },
        error: e,
      })
      return err(new InvalidOOBParamsError())
    }

    const destination = `${payloads[0]}${decodedQuery}`

    const idpId =
      authType === FormAuthType.SP
        ? this.#spcpProps.spIdpId
        : this.#spcpProps.cpIdpId
    let cookieDuration: number
    if (authType === FormAuthType.CP) {
      cookieDuration = this.#spcpProps.cpCookieMaxAge
    } else {
      cookieDuration = rememberMe
        ? this.#spcpProps.spCookieMaxAgePreserved
        : this.#spcpProps.spCookieMaxAge
    }
    if (isValidAuthenticationQuery(samlArt, destination, idpId)) {
      return ok({
        formId,
        destination,
        rememberMe,
        cookieDuration,
      })
    } else {
      logger.error({
        message: 'Invalid authentication query',
        meta: logMeta,
      })
      return err(new InvalidOOBParamsError())
    }
  }

  /**
   * Retrieves th UIN/FIN (for Singpass) and the Entity ID and UID (for Corppass).
   * @param samlArt SAML artifact
   * @param destination Redirect destination
   * @param authType 'SP' or 'CP'
   * @return The raw attributes returned by SP or CP
   */
  getSpcpAttributes(
    samlArt: string,
    destination: string,
    authType: FormAuthType.SP | FormAuthType.CP,
  ): ResultAsync<Record<string, unknown>, RetrieveAttributesError> {
    const logMeta = {
      action: 'getSpcpAttributes',
      authType,
      destination,
      samlArt,
    }
    const authClient = this.getAuthClient(authType)
    return ResultAsync.fromPromise(
      getAttributesPromise(authClient, samlArt, destination),
      (error) => {
        logger.error({
          message: 'Failed to retrieve attributes from SP/CP',
          meta: logMeta,
          error,
        })
        return new RetrieveAttributesError()
      },
    )
  }

  /**
   * Creates a JWT with a payload of SP/CP user data.
   * @param payload Information to add to JWT
   * @param cookieDuration Cookie validity duration
   * @param authType 'SP' or 'CP'
   * @return The JWT in a string
   */
  createJWT(
    payload: JwtPayload,
    cookieDuration: number,
    authType: FormAuthType.SP | FormAuthType.CP,
  ): Result<string, ApplicationError> {
    const authClient = this.getAuthClient(authType)
    return ok(
      authClient.createJWT(
        payload,
        cookieDuration / 1000,
        // NOTE: cookieDuration is interpreted as a seconds count if numeric.
      ),
    )
  }

  /**
   * Creates a payload of SP/CP user data based on attributes
   * @param attributes Raw attributes returned by SP/CP
   * @param rememberMe Whether to enable longer duration for SingPass cookies
   * @param authType 'SP' or 'CP'
   * @return The payload
   */
  createJWTPayload(
    attributes: Record<string, unknown>,
    rememberMe: boolean,
    authType: FormAuthType.SP | FormAuthType.CP,
  ): Result<JwtPayload, MissingAttributesError> {
    if (authType === FormAuthType.SP) {
      const userName = (attributes as SingpassAttributes).UserName
      return userName && typeof userName === 'string'
        ? ok({ userName, rememberMe })
        : err(new MissingAttributesError())
    }
    // CorpPass
    const userName = (attributes as CorppassAttributes)?.UserInfo?.CPEntID
    const userInfo = (attributes as CorppassAttributes)?.UserInfo?.CPUID
    return userName && userInfo
      ? ok({ userName, userInfo, rememberMe })
      : err(new MissingAttributesError())
  }

  /**
   * Gets the cookie domain settings.
   */
  getCookieSettings(): SpcpDomainSettings {
    const spcpCookieDomain = this.#spcpProps.spcpCookieDomain
    return spcpCookieDomain ? { domain: spcpCookieDomain, path: '/' } : {}
  }

  /**
   * Gets the spcp session info from the auth, cookies
   * @param authType The authentication type of the user
   * @param cookies The spcp cookies set by the redirect
   * @return ok(jwtPayload) if successful
   * @return err(MissingJwtError) if the specified cookie for the authType (spcp) does not exist
   * @return err(VerifyJwtError) if the jwt exists but could not be authenticated
   * @return err(InvalidJwtError) if the jwt exists but the payload is invalid
   */
  extractJwtPayloadFromRequest(
    authType: FormAuthType.SP | FormAuthType.CP,
    cookies: SpcpCookies,
  ): ResultAsync<
    JwtPayloadFromCookie,
    VerifyJwtError | InvalidJwtError | MissingJwtError
  > {
    return this.extractJwt(cookies, authType).asyncAndThen((jwtResult) => {
      switch (authType) {
        case FormAuthType.SP:
          return this.extractSingpassJwtPayload(jwtResult)
        case FormAuthType.CP:
          return this.extractCorppassJwtPayload(jwtResult)
      }
    })
  }
}

export const SpcpService = new SpcpServiceClass(spcpMyInfoConfig)

/**
 * Class for executing Singpass/Corppass-related services.
 * Exported for testing.
 */
export class SpOidcServiceClass {
  #publicJwks: PublicJwk
  #secretJwks: SecretJwk

  constructor() {
    this.#publicJwks = JSON.parse(
      fs.readFileSync(spcpMyInfoConfig.spOidcRpJwksPublicPath).toString(),
    )
  }

  /**
   * Retrieves the public JWKS hosted on the app's well-known end point
   */
  get publicJwks(): PublicJwk {
    return this.#publicJwks
  }
}

export const SpcpOidcService = new SpOidcServiceClass()
