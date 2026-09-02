import { IPerson, IPersonResponse } from '@opengovsg/myinfo-gov-client'
import { MyInfoAttribute as InternalAttr } from 'formsg-shared/types'
import { err, ok, Result } from 'neverthrow'
import type * as client from 'openid-client'

import { createLoggerWithLabel } from '../../../config/logger'
import { internalAttrListToScopes } from '../myinfo.adapter'

import { MyInfoFapiMissingUinFinError } from './myinfo.fapi.errors'

const logger = createLoggerWithLabel(module)

type MyInfoFapiUserInfo = client.UserInfoResponse & {
  person_info?: IPerson & { uinfin?: { value?: string } }
}

/**
 * Builds the space-separated FAPI scope string for a form's requested attributes.
 * @param attrs - The internal attributes.
 * @returns The space-separated FAPI scope string.
 */
export const requestedAttrsToScopeString = (attrs: InternalAttr[]): string =>
  Array.from(new Set(['openid', ...internalAttrListToScopes(attrs)])).join(' ')

/**
 * Maps FAPI userinfo onto v3's IPersonResponse so everything below MyInfoData is shared.
 * @param claims - The FAPI userinfo claims.
 * @returns The v3 IPersonResponse.
 */
export const userInfoToPersonResponse = (
  claims: client.UserInfoResponse,
): Result<IPersonResponse, MyInfoFapiMissingUinFinError> => {
  const { person_info: personInfo } = claims as MyInfoFapiUserInfo
  const uinFin = personInfo?.uinfin?.value

  if (!personInfo || !uinFin) {
    logger.error({
      message: 'MyInfo FAPI userinfo had no uinfin',
      meta: {
        action: 'userInfoToPersonResponse',
        hasPersonInfo: !!personInfo,
        hasUinFin: !!uinFin,
      },
    })
    return err(new MyInfoFapiMissingUinFinError())
  }

  return ok({ uinFin, data: personInfo })
}
