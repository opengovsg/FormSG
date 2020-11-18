import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import axios from 'axios'
import fs from 'fs'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import { err, errAsync, ok, Result, ResultAsync } from 'neverthrow'

import { ISpcpMyInfo } from '../../../config/feature-manager'
import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType, ILoginSchema } from '../../../types'
import getFormModel from '../../models/form.server.model'
import getLoginModel from '../../models/login.server.model'
import { DatabaseError } from '../core/core.errors'
import { FormNotFoundError } from '../form/form.errors'

import {
  AuthTypeMismatchError,
  CreateRedirectUrlError,
  FetchLoginPageError,
  InvalidOOBParamsError,
  LoginPageValidationError,
  RetrieveAttributesError,
  VerifyJwtError,
} from './spcp.errors'
import { JwtPayload, LoginPageValidationResult } from './spcp.types'
import {
  extractDestination,
  extractFormId,
  getAttributesPromise,
  getSubstringBetween,
  isValidAuthenticationQuery,
  verifyJwtPromise,
} from './spcp.util'

const logger = createLoggerWithLabel(module)
const FormModel = getFormModel(mongoose)
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
    if (!title) {
      logger.error({
        message: 'Could not find SP/CP login page title',
        meta: {
          action: 'validateLoginPage',
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
   * Verifies a JWT and extracts its payload.
   * @param jwt The contents of the JWT cookie
   * @param authType 'SP' or 'CP'
   */
  extractJwtPayload(
    jwt: string,
    authType: AuthType.SP | AuthType.CP,
  ): ResultAsync<JwtPayload, VerifyJwtError> {
    const authClient = this.getAuthClient(authType)
    return ResultAsync.fromPromise(
      verifyJwtPromise(authClient, jwt),
      (error) => {
        logger.error({
          message: 'Failed to verify JWT with auth client',
          meta: {
            action: 'extractPayload',
            authType,
          },
          error,
        })
        return new VerifyJwtError()
      },
    )
  }

  validateOOBParams(
    samlArt: string,
    relayState: string,
    authType: AuthType.SP | AuthType.CP,
  ): Result<true, InvalidOOBParamsError> {
    const logMeta = {
      action: 'validateOOBParams',
      relayState,
      samlArt,
      authType,
    }
    if (relayState.split(',').length !== 2) {
      logger.error({
        message: 'RelayState incorrectly formatted',
        meta: logMeta,
      })
      return err(new InvalidOOBParamsError())
    }
    const destination = extractDestination(relayState)
    const idpId =
      authType === AuthType.SP
        ? this.#spcpProps.spIdpId
        : this.#spcpProps.cpIdpId
    if (isValidAuthenticationQuery(samlArt, destination, idpId)) {
      return ok(true)
    } else {
      logger.error({
        message: 'Invalid authentication query',
        meta: logMeta,
      })
      return err(new InvalidOOBParamsError())
    }
  }

  getSpcpAttributes(
    samlArt: string,
    relayState: string,
    authType: AuthType.SP | AuthType.CP,
  ): ResultAsync<Record<string, unknown>, RetrieveAttributesError> {
    const logMeta = {
      action: 'getSpcpAttributes',
      authType,
      relayState,
      samlArt,
    }
    // Resolve known express req.query issue where pluses become spaces
    samlArt = String(samlArt).replace(/ /g, '+')
    const authClient = this.getAuthClient(authType)
    return ResultAsync.fromPromise(
      getAttributesPromise(authClient, samlArt, relayState),
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

  createJWT(
    payload: Record<string, unknown>,
    authType: AuthType.SP | AuthType.CP,
    rememberMe: boolean,
  ): Result<string, never> {
    let cookieDuration: number
    if (authType === AuthType.CP) {
      cookieDuration = this.#spcpProps.cpCookieMaxAge
    } else {
      cookieDuration = rememberMe
        ? this.#spcpProps.spCookieMaxAgePreserved
        : this.#spcpProps.spCookieMaxAge
    }
    const authClient = this.getAuthClient(authType)
    return ok(
      authClient.createJWT(
        payload,
        cookieDuration / 1000,
        // NOTE: cookieDuration is interpreted as a seconds count if numeric.
      ),
    )
  }

  addLogin(
    relayState: string,
    authType: AuthType.SP | AuthType.CP,
  ): ResultAsync<ILoginSchema, FormNotFoundError | DatabaseError> {
    const formId = extractFormId(relayState)
    const logMeta = {
      action: 'addLogin',
      formId,
      relayState,
    }
    return ResultAsync.fromPromise(
      FormModel.getFullFormById(formId),
      (error) => {
        logger.error({
          message: 'Error getting form from database',
          meta: logMeta,
          error,
        })
        return new DatabaseError()
      },
    ).andThen((form) => {
      if (!form) {
        logger.error({
          message: 'Could not find form specified by relay state',
          meta: logMeta,
        })
        return errAsync(new FormNotFoundError())
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
          return new DatabaseError()
        },
      )
    })
  }
}
