import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import axios from 'axios'
import fs from 'fs'
import { StatusCodes } from 'http-status-codes'
import { err, errAsync, ok, Result, ResultAsync } from 'neverthrow'

import { ISpcpMyInfo } from '../../../config/feature-manager'
import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType } from '../../../types'

import {
  CreateRedirectUrlError,
  FetchLoginPageError,
  InvalidAuthTypeError,
  InvalidOOBParamsError,
  LoginPageValidationError,
  VerifyJwtError,
} from './spcp.errors'
import { JwtPayload, LoginPageValidationResult } from './spcp.types'
import {
  extractDestination,
  getSubstringBetween,
  isValidAuthenticationQuery,
  verifyJwtPromise,
} from './spcp.util'

const logger = createLoggerWithLabel(module)
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
  ): Result<string, CreateRedirectUrlError | InvalidAuthTypeError> {
    if (authType !== AuthType.SP && authType !== AuthType.CP) {
      logger.error({
        message: 'Invalid authType',
        meta: {
          action: 'createRedirectUrl',
          authType,
          target,
          esrvcId,
        },
      })
      return err(new InvalidAuthTypeError(authType))
    }
    const authClient = this.getAuthClient(authType)
    const result = authClient.createRedirectURL(target, esrvcId)
    if (typeof result === 'string') {
      return ok(result)
    } else {
      logger.error({
        message: 'Error while creating redirect URL',
        meta: {
          action: 'createRedirectUrl',
          authType,
          target,
          esrvcId,
        },
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
  ): ResultAsync<JwtPayload, VerifyJwtError | InvalidAuthTypeError> {
    let authClient: SPCPAuthClient
    switch (authType) {
      case AuthType.SP:
        authClient = this.#singpassAuthClient
        break
      case AuthType.CP:
        authClient = this.#corppassAuthClient
        break
      default:
        return errAsync(new InvalidAuthTypeError(authType))
    }
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
  ): Result<true, InvalidOOBParamsError | InvalidAuthTypeError> {
    if (authType !== AuthType.SP && authType !== AuthType.CP) {
      return err(new InvalidAuthTypeError(authType))
    }
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
}
