import axios from 'axios'
import Cookies from 'js-cookie'
import jwtDecode from 'jwt-decode'
import { z } from 'zod'

import { AuthType } from '../../types'
import {
  PublicFormAuthRedirectDto,
  PublicFormAuthValidateEsrvcIdDto,
} from '../../types/api'

type AuthTypeWithJwt = AuthType.CP | AuthType.SP

/**
 * Exported for testing.
 */
export enum PublicFormAuthCookieName {
  SP = 'jwtSp',
  CP = 'jwtCp',
}

export const SpcpAuth = z.object({
  userName: z.string(),
  rememberMe: z.boolean(),
  iat: z.number(),
  exp: z.number(),
})
export type SpcpAuth = z.infer<typeof SpcpAuth>

// Exported for testing
export const PUBLIC_FORMS_ENDPOINT = '/api/v3/forms'

export const createRedirectURL = async (
  formId: string,
  isPersistentLogin = false,
): Promise<PublicFormAuthRedirectDto> => {
  return axios
    .get<PublicFormAuthRedirectDto>(
      `${PUBLIC_FORMS_ENDPOINT}/${formId}/auth/redirect`,
      {
        params: { isPersistentLogin },
      },
    )
    .then(({ data }) => data)
}

export const validateEsrvcId = async (
  formId: string,
): Promise<PublicFormAuthValidateEsrvcIdDto> => {
  return axios
    .get<PublicFormAuthValidateEsrvcIdDto>(
      `${PUBLIC_FORMS_ENDPOINT}/${formId}/auth/validate`,
    )
    .then(({ data }) => data)
}

/**
 * Returns the name of the cookie that corresponds to the auth type provided.
 * @param authType the auth type to retrieve the mapped cookie name for
 * @returns cookie name if mapping exists, null otherwise
 */
const mapAuthTypeToCookieName = (
  authType: AuthTypeWithJwt,
): PublicFormAuthCookieName | null => {
  switch (authType) {
    case AuthType.SP:
      return PublicFormAuthCookieName.SP
    case AuthType.CP:
      return PublicFormAuthCookieName.CP
    default:
      return null
  }
}

/**
 * Get stored public form auth jwt of given authType, if available.
 * @param authType the type of jwt to retrieve
 * @returns jwt string related to authType if available, else return null
 */
export const getStoredJwt = (authType: AuthTypeWithJwt): string | null => {
  const cookieName = mapAuthTypeToCookieName(authType)
  if (!cookieName) return null
  return Cookies.get(cookieName) ?? null
}

/**
 * Decodes and returns decoded jwt of auth type, if any.
 * On any errors, the retrieved jwt will also be deleted.
 *
 * @param authType the authType to retrieve mapped JWT from for decoding
 * @returns decoded JWT object if cookie was available, null otherwise
 * @throws jwt-decode#InvalidTokenError if retrieved jwt is malformed
 * @throws Error if retrieved jwt shape does not match expected
 */
export const getDecodedJwt = (authType: AuthTypeWithJwt): SpcpAuth | null => {
  const jwt = getStoredJwt(authType)
  if (!jwt) return null

  try {
    return SpcpAuth.parse(jwtDecode(jwt))
  } catch (error) {
    // On error, delete cookie that is a malformed or misshapen JWT.
    logout(authType)
    // Rethrow error for caller to handle.
    // eslint-disable-next-line typesafe/no-throw-sync-func
    throw error
  }
}

/**
 * Logs out of public form by removing stored cookie based on auth type provided.
 * @param authType the auth type for deleting cookie mapped to that auth type
 */
export const logout = (
  authType: AuthTypeWithJwt,
  options: Cookies.CookieAttributes = {},
): void => {
  const cookieToRemove = mapAuthTypeToCookieName(authType)
  // Only remove if there is a valid mapping and there is a stored jwt already.
  if (cookieToRemove && getStoredJwt(authType)) {
    Cookies.remove(cookieToRemove, options)
  }
}
