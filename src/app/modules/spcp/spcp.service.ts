import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import fs from 'fs'
import { err, ok, Result } from 'neverthrow'

import { ISpcpMyInfo } from '../../../config/feature-manager'
import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType } from '../../../types'

import { CreateRedirectUrlError, InvalidAuthTypeError } from './spcp.errors'

const logger = createLoggerWithLabel(module)
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
}
