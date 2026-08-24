import {
  AccountInfo,
  AuthError,
  AuthorizationUrlRequest,
  ConfidentialClientApplication,
} from '@azure/msal-node'
import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'

import config from '../../../config/config'
import { wogad } from '../../../config/features/wogad.config'
import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { resolveAppUrl } from '../../../utils/urls'
import { ControllerHandler } from '../../core/core.types'
import * as UserService from '../../user/user.service'
import * as AuthService from '../auth.service'

const logger = createLoggerWithLabel(module)

const clientConfig = {
  auth: {
    clientId: wogad.clientId,
    clientSecret: wogad.clientSecret,
    authority: wogad.authority,
  },
}
const isWogadConfigDefined =
  wogad.clientId && wogad.clientSecret && wogad.authority
const ccaSingleton = isWogadConfigDefined
  ? new ConfidentialClientApplication(clientConfig)
  : null
const redirectUri = resolveAppUrl(`${wogad.redirectUri}`)

/**
 * Name of the cookie holding the PKCE code verifier for the WOG AD flow.
 */
export const WOGAD_CODE_VERIFIER_COOKIE_NAME = 'wogadCodeVerifier'

const validateWogadConfig: ControllerHandler = (_req, res, next) => {
  if (!isWogadConfigDefined || !ccaSingleton) {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
      message:
        'WOG AD is not supported. Please use another authentication method.',
    })
  }
  return next()
}
/**
 * Generates the WOG AD Authorization URL.
 *
 * Flow:
 * 1. After receiving the auth URL, the browser redirects to WOG AD with the csrf token in the state and completes the authentication challenge.
 * 2. Then, WOG AD will redirect the browser to the registered redirect URI with the code and the same csrf token the browser passed in its initial request.
 */
const _generateAuthUrl: ControllerHandler<
  unknown,
  { authUrl: string; csrfToken: string }
> = async (req, res) => {
  const logMeta = {
    action: 'wogadGenerateAuthUrl',
    ...createReqMeta(req),
  }

  if (!ccaSingleton) {
    logger.error({
      message: 'WOG AD is not configured.',
      meta: logMeta,
    })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
  }

  const csrfToken = crypto.randomBytes(32).toString('hex')

  const authCodeUrlParams: AuthorizationUrlRequest = {
    state: csrfToken,
    scopes: ['openid', 'email'],
    redirectUri,
  }

  res.cookie('csrf_token', csrfToken, {
    httpOnly: true,
    secure: !config.isDevOrTest,
    sameSite: !config.isDevOrTest ? 'strict' : undefined,
  })

  const authUrl = await ccaSingleton.getAuthCodeUrl(authCodeUrlParams)

  return res.status(StatusCodes.OK).json({ authUrl, csrfToken })
}

export const generateAuthUrlForTest = _generateAuthUrl

export const generateAuthUrl = [
  validateWogadConfig,
  _generateAuthUrl,
] as ControllerHandler[]

/**
 * This verifies the auth code and returns the access and id token.
 *
 * Flow:
 * 1. This endpoint is called after the browser is redirected to the redirect URI with the code and csrf token.
 * 2. Then, it will send over the code and csrf token to the backend.
 * 3. The backend will verify the csrf token matches before using the code to retrieve the access token.
 * 4. This access token will also include the additional metadata such as admin's email in the same HTTPS response payload.
 * (Hence, no validation of signature is needed.)
 * 5. Once the access token is retrieved, we will perform checks on whitelist access.
 * 6. Then, we can modify the session to include the user's id and persist this session in the store as active.
 * 7. Also, we include a grant source to indicate that the user logged in via WOG AD. This is useful during logout.
 * 8. At this point, the user is logged in and can access the protected routes using FormSG's session mechanism.
 */
const _handleVerifyWithCode: ControllerHandler<
  unknown,
  unknown,
  { code: string; csrfToken: string }
> = async (req, res) => {
  const logMeta = {
    action: 'wogadHandleVerifyWithCode',
    ...createReqMeta(req),
  }

  if (!ccaSingleton) {
    logger.error({
      message: 'WOG AD is not configured.',
      meta: logMeta,
    })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
  }

  const csrfTokenFromCookie = req.cookies['csrf_token']
  const csrfTokenFromBody = req.body['csrfToken']

  if (!csrfTokenFromCookie || csrfTokenFromCookie !== csrfTokenFromBody) {
    logger.error({
      message: 'CSRF token mismatch',
      meta: logMeta,
    })
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'CSRF token mismatch',
    })
  }

  const code = req.body['code']
  const codeVerifier = req.cookies[WOGAD_CODE_VERIFIER_COOKIE_NAME]

  const tokenRequest = {
    code,
    scopes: ['openid', 'email'],
    redirectUri,
    codeVerifier,
  }

  let account: AccountInfo | null
  try {
    const token = await ccaSingleton.acquireTokenByCode(tokenRequest)
    account = token.account
  } catch (error) {
    let details: Record<string, string> = {}
    if (error instanceof AuthError) {
      const authError = error as AuthError

      details = {
        correlationId: authError?.correlationId,
        errorCode: authError?.errorCode,
        errorMessage: authError?.errorMessage,
        subError: authError?.subError,
        message: authError?.message,
      }
    }
    logger.error({
      message: `Error acquiring token by code error`,
      meta: {
        ...logMeta,
        ...details,
      },
    })
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'Error acquiring token by code',
    })
  }

  await removeAccountFromTokenCache(account)

  const userEmail = account?.username?.toLowerCase()

  if (!userEmail) {
    logger.error({
      message: 'WOG AD user is not found',
      meta: logMeta,
    })
    return res.status(StatusCodes.NOT_FOUND).json({
      message: 'WOG AD user is not found',
    })
  }

  const logMetaWithUserEmail = { ...logMeta, userEmail }

  const validateEmailWhitelistedResult =
    await AuthService.validateEmailDomain(userEmail)
  if (validateEmailWhitelistedResult.isErr()) {
    logger.error({
      message: 'WOG AD user is not whitelisted',
      meta: logMetaWithUserEmail,
    })
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'WOG AD user is not whitelisted',
    })
  }

  return UserService.retrieveUser(
    userEmail,
    validateEmailWhitelistedResult.value._id,
  )
    .map((user) => {
      if (!req.session) {
        logger.error({
          message: 'Could not find valid session',
          meta: logMetaWithUserEmail,
        })
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json('Could not find valid session')
      }

      // Add user info to session.
      const { _id } = user
      req.session.user = { _id, grantSource: 'wogad' }

      logger.info({
        message: 'User logged in via WOG AD',
        meta: logMetaWithUserEmail,
      })

      return res.status(StatusCodes.OK).json(user)
    })
    .mapErr(() => {
      logger.error({
        message: 'Failed to load or create user',
        meta: logMetaWithUserEmail,
      })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to load or create user. Please try again.',
      })
    })
}

/**
 * Clear the account from the token cache.
 * This helps to free memory since the token is no longer needed
 * after authentication since we are using FormSG's session mechanism.
 * @param account The account to clear from the token cache.
 * @returns void
 */
const removeAccountFromTokenCache = async (account: AccountInfo | null) => {
  if (!account || !ccaSingleton) {
    return
  }
  const tokenCache = ccaSingleton.getTokenCache()
  await tokenCache.removeAccount(account)
}

export const handleVerifyWithCodeForTest = _handleVerifyWithCode

export const handleVerifyWithCode = [
  validateWogadConfig,
  _handleVerifyWithCode,
] as ControllerHandler[]

/**
 * Get the logout URL for the WOG AD.
 *
 * @returns The logout URL for the WOG AD, if it exists.
 */
const _getLogoutUrl: ControllerHandler<
  unknown,
  {
    logoutUrl: string
  }
> = async (req, res) => {
  const logMeta = {
    action: 'wogadGetLogoutUrl',
    ...createReqMeta(req),
  }

  if (!ccaSingleton) {
    logger.error({
      message: 'WOG AD is not configured.',
      meta: logMeta,
    })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
  }

  const postLogoutRedirectUri = resolveAppUrl('/')
  return res.status(StatusCodes.OK).json({
    logoutUrl: `${wogad.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`,
  })
}

export const getLogoutUrlForTest = _getLogoutUrl

export const getLogoutUrl = [
  validateWogadConfig,
  _getLogoutUrl,
] as ControllerHandler[]
