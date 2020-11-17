import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import axios from 'axios'
import fs from 'fs'
import { StatusCodes } from 'http-status-codes'
import { err, ok, Result, ResultAsync } from 'neverthrow'

import { ISpcpMyInfo } from '../../../config/feature-manager'
import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType } from '../../../types'

import {
  CreateRedirectUrlError,
  FetchLoginPageError,
  InvalidAuthTypeError,
  LoginPageValidationError,
} from './spcp.errors'
import { getSubstringBetween } from './spcp.util'

const logger = createLoggerWithLabel(module)
const LOGIN_PAGE_HEADERS =
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3'
const LOGIN_PAGE_TIMEOUT = 10000 // 10 seconds
export class SpcpService {
  #singpassAuthClient: SPCPAuthClient
  #corppassAuthClient: SPCPAuthClient

  constructor(props: ISpcpMyInfo) {
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

  createRedirectUrl(
    authType: AuthType.SP | AuthType.CP,
    target: string,
    esrvcId: string,
  ): Result<string, CreateRedirectUrlError | InvalidAuthTypeError> {
    let result: string | Error
    switch (authType) {
      case AuthType.SP:
        result = this.#singpassAuthClient.createRedirectURL(target, esrvcId)
        break
      case AuthType.CP:
        result = this.#corppassAuthClient.createRedirectURL(target, esrvcId)
        break
      default:
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
          message: 'Error while creating redirect URL',
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

  validateLoginPage(
    loginHtml: string,
  ): Result<string | null, LoginPageValidationError> {
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
      return ok(null)
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
      return ok(errorCode)
    }
  }
}
