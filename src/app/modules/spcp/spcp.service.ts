import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import fs from 'fs'
import { err, ok, Result } from 'neverthrow'

import { ISpcpMyInfo } from '../../../config/feature-manager'

import { CreateRedirectUrlError } from './spcp.errors'

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

  createSingpassRedirectUrl(
    target: string,
    eSrvcId: string,
  ): Result<string, CreateRedirectUrlError> {
    const result = this.#singpassAuthClient.createRedirectURL(target, eSrvcId)
    if (typeof result === 'string') {
      return ok(result)
    } else {
      return err(new CreateRedirectUrlError())
    }
  }

  createCorppassRedirectUrl(
    target: string,
    eSrvcId: string,
  ): Result<string, CreateRedirectUrlError> {
    const result = this.#corppassAuthClient.createRedirectURL(target, eSrvcId)
    if (typeof result === 'string') {
      return ok(result)
    } else {
      return err(new CreateRedirectUrlError())
    }
  }
}
