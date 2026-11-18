import { FormAuthType, MyInfoAttribute } from 'formsg-shared/types'
import {
  getLoginIdentityAttr,
  LoginIdentityCandidate,
} from 'formsg-shared/utils/login-identity'
import { getVerifiedQuestionPrefix } from 'formsg-shared/utils/myinfo-prefix'
import { err, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import { ApplicationError } from '../core/core.errors'
import {
  getLoginIdentityValues,
  LoginIdentityValues,
} from '../form/public-form/public-form.utils'
import { MyInfoHashDidNotMatchError } from '../myinfo/myinfo.errors'
import { MyInfoService } from '../myinfo/myinfo.service'
import { extractMyInfoLoginJwt } from '../myinfo/myinfo.util'
import { getOidcService } from '../spcp/spcp.oidc.service'

/** The identities the respondent's current login provides. */
export const getLoginIdentityValuesFromCookies = (
  authType: FormAuthType,
  cookies: Record<string, unknown>,
): ResultAsync<LoginIdentityValues, ApplicationError> => {
  switch (authType) {
    case FormAuthType.CP: {
      const oidcService = getOidcService(FormAuthType.CP)
      return oidcService
        .extractJwt(cookies)
        .asyncAndThen((jwt) => oidcService.extractJwtPayload(jwt))
        .map((payload) => getLoginIdentityValues(authType, payload))
    }
    case FormAuthType.MyInfo:
      return extractMyInfoLoginJwt(cookies)
        .andThen(MyInfoService.verifyLoginJwt)
        .asyncMap(async ({ uinFin }) =>
          getLoginIdentityValues(authType, { userName: uinFin }),
        )
    default:
      return okAsync({})
  }
}

/**
 * Checks each answered login identity field against the login, the way MyInfo
 * answers are checked against their prefill hashes. An empty answer is left to
 * required-field validation.
 * @returns the IDs of identity fields whose answers match the login
 * @returns err(MyInfoHashDidNotMatchError) if any answer differs from the login
 */
export const checkLoginIdentityAnswers = (
  formFields: readonly LoginIdentityCandidate[],
  getAnswer: (fieldId: string) => unknown,
  values: LoginIdentityValues,
): Result<string[], MyInfoHashDidNotMatchError> => {
  const verifiedFieldIds: string[] = []
  for (const field of formFields) {
    const attr = getLoginIdentityAttr(field)
    if (!attr) continue
    const fieldId = String(field._id)
    const answer = getAnswer(fieldId)
    if (typeof answer !== 'string' || !answer.trim()) continue
    if (answer.trim().toUpperCase() !== values[attr]?.trim().toUpperCase()) {
      return err(
        new MyInfoHashDidNotMatchError(
          'Login identity answer did not match the login',
        ),
      )
    }
    verifiedFieldIds.push(fieldId)
  }
  return ok(verifiedFieldIds)
}

/**
 * Marks verified identity answers, as storage mode marks MyInfo answers:
 * `[Myinfo] NRIC/FIN` or `[Myinfo] UEN`, for Singpass and Corppass alike.
 * Mutates the responses in place.
 */
export const prefixLoginIdentityQuestions = (
  responses: readonly { _id: string; question: string }[],
  formFields: readonly LoginIdentityCandidate[],
  verifiedFieldIds: readonly string[],
): void => {
  const verified = new Set(verifiedFieldIds)
  const fieldsById = new Map(
    formFields.map((field) => [String(field._id), field]),
  )
  for (const response of responses) {
    const field = fieldsById.get(String(response._id))
    if (!field) continue
    // Schema fields type attr as string, so rebuild the field from its
    // checked identity before choosing the prefix.
    const attr = getLoginIdentityAttr(field)
    const prefix = getVerifiedQuestionPrefix(
      {
        _id: String(field._id),
        myInfo: attr === MyInfoAttribute.UinFin ? { attr } : undefined,
        corppass:
          attr && attr !== MyInfoAttribute.UinFin ? { attr } : undefined,
      },
      verified,
    )
    response.question = `${prefix}${response.question}`
  }
}
