import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import axios from 'axios'
import fs from 'fs'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import { ISpcpMyInfo } from '../../../config/feature-manager'
import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType, ILoginSchema, IPopulatedForm } from '../../../types'
import getLoginModel from '../../models/login.server.model'
import { ApplicationError, DatabaseError } from '../core/core.errors'

import {
  AuthTypeMismatchError,
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
  JwtName,
  JwtPayload,
  LoginPageValidationResult,
  ParsedSpcpParams,
  SingpassAttributes,
  SpcpCookies,
  SpcpDomainSettings,
} from './spcp.types'
import {
  extractFormId,
  getAttributesPromise,
  getSubstringBetween,
  isJwtPayload,
  isValidAuthenticationQuery,
  verifyJwtPromise,
} from './spcp.util'

const logger = createLoggerWithLabel(module)
const LoginModel = getLoginModel(mongoose)

const LOGIN_PAGE_HEADERS =
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3'
const LOGIN_PAGE_TIMEOUT = 10000 // 10 seconds
export class SpcpService {
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
  getAuthClient(authType: AuthType.SP | AuthType.CP): SPCPAuthClient {
    if (authType === AuthType.SP) {
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
    authType: AuthType.SP | AuthType.CP,
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
  ): Result<LoginPageValidationResult, LoginPageValidationError> {
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
    if (title.indexOf('Error') === -1) {
      return ok({ isValid: true })
    } else {
      // The error page should have text like 'System Code:&nbsp<b>138</b>'
      const errorCode = getSubstringBetween(
        loginHtml,
        'System Code:&nbsp<b>',
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
    authType: AuthType.SP | AuthType.CP,
  ): Result<string, MissingJwtError> {
    const jwtName = authType === AuthType.SP ? JwtName.SP : JwtName.CP
    const cookie = cookies[jwtName]
    if (!cookie) {
      return err(new MissingJwtError())
    }
    return ok(cookie)
  }

  /**
   * Verifies a JWT and extracts its payload.
   * @param jwt The contents of the JWT cookie
   * @param authType 'SP' or 'CP'
   */
  extractJwtPayload(
    jwt: string,
    authType: AuthType.SP | AuthType.CP,
  ): ResultAsync<JwtPayload, VerifyJwtError | InvalidJwtError> {
    const logMeta = {
      action: 'extractJwtPayload',
      authType,
    }
    const authClient = this.getAuthClient(authType)
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
      if (isJwtPayload(payload, authType)) {
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
    authType: AuthType.SP | AuthType.CP,
  ): Result<ParsedSpcpParams, InvalidOOBParamsError> {
    const logMeta = {
      action: 'validateOOBParams',
      relayState,
      samlArt,
      authType,
    }
    const payloads = relayState.split(',')
    const formId = extractFormId(payloads[0])
    if (payloads.length !== 2 || !formId) {
      logger.error({
        message: 'RelayState incorrectly formatted',
        meta: logMeta,
      })
      return err(new InvalidOOBParamsError())
    }
    const destination = payloads[0]
    const rememberMe = payloads[1] === 'true'
    const idpId =
      authType === AuthType.SP
        ? this.#spcpProps.spIdpId
        : this.#spcpProps.cpIdpId
    let cookieDuration: number
    if (authType === AuthType.CP) {
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
        // Resolve known express req.query issue where pluses become spaces
        samlArt: String(samlArt).replace(/ /g, '+'),
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
    authType: AuthType.SP | AuthType.CP,
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
    authType: AuthType.SP | AuthType.CP,
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
   * Adds an SP/CP login record to the database.
   * @param form Form populated with admin and agency data
   * @param authType 'SP' or 'CP'
   * @return The Login document saved to the database
   */
  addLogin(
    form: IPopulatedForm,
    authType: AuthType.SP | AuthType.CP,
  ): ResultAsync<ILoginSchema, AuthTypeMismatchError | DatabaseError> {
    const logMeta = {
      action: 'addLogin',
      formId: form._id,
    }
    if (form.authType !== authType) {
      logger.error({
        message: 'Form auth type did not match attempted auth type',
        meta: {
          ...logMeta,
          attemptedAuthType: authType,
          formAuthType: form.authType,
        },
      })
      return errAsync(new AuthTypeMismatchError(authType, form.authType))
    }
    return ResultAsync.fromPromise(
      LoginModel.addLoginFromForm(form),
      (error) => {
        logger.error({
          message: 'Error adding login to database',
          meta: logMeta,
          error,
        })
        // TODO (#614): Use utility to return better error message
        return new DatabaseError()
      },
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
    authType: AuthType.SP | AuthType.CP,
  ): Result<JwtPayload, MissingAttributesError> {
    if (authType === AuthType.SP) {
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
}
