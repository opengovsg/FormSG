import { IPerson, IPersonResponse } from '@opengovsg/myinfo-gov-client'
import { MyInfoAttribute as InternalAttr } from 'formsg-shared/types'
import { err, ok, Result } from 'neverthrow'
import type * as client from 'openid-client'

import { createLoggerWithLabel } from '../../../config/logger'
import {
  internalAttrListToScopes,
  InternalAttrListToScopesOptions,
} from '../myinfo.adapter'

import { MyInfoFapiMissingUinFinError } from './myinfo.fapi.errors'

const logger = createLoggerWithLabel(module)

type MyInfoFapiUserInfo = client.UserInfoResponse & {
  person_info?: IPerson & { uinfin?: { value?: string } }
}

/**
 * Builds the space-separated FAPI scope string for a form's requested attributes.
 * @param attrs - The internal attributes.
 * @param options - See internalAttrListToScopes.
 * @returns The space-separated FAPI scope string.
 */
export const requestedAttrsToScopeString = (
  attrs: InternalAttr[],
  options?: InternalAttrListToScopesOptions,
): string =>
  Array.from(
    new Set(['openid', ...internalAttrListToScopes(attrs, options)]),
  ).join(' ')

/**
 * Maps MyInfo userinfo onto the shared IPersonResponse so MyInfoData and
 * hashing/prefill stay on one adapter.
 * @param claims - The userinfo claims.
 * @returns The IPersonResponse.
 */
export const userInfoToPersonResponse = (
  claims: client.UserInfoResponse,
): Result<IPersonResponse, MyInfoFapiMissingUinFinError> => {
  const { person_info: personInfo } = claims as MyInfoFapiUserInfo
  const uinFin = personInfo?.uinfin?.value

  if (!personInfo || !uinFin) {
    const missingUinFinError = new MyInfoFapiMissingUinFinError()
    logger.error({
      message: 'MyInfo FAPI userinfo had no uinfin',
      meta: {
        action: 'userInfoToPersonResponse',
        hasPersonInfo: !!personInfo,
        hasUinFin: !!uinFin,
      },
      error: missingUinFinError,
    })
    return err(missingUinFinError)
  }

  return ok({ uinFin, data: personInfo })
}
