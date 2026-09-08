import { IPersonResponse } from '@opengovsg/myinfo-gov-client'
import { MyInfoAttribute } from 'formsg-shared/types'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import * as client from 'openid-client'

import { createLoggerWithLabel } from '../../../config/logger'
import { DatabaseError } from '../../core/core.errors'
import { MyInfoData } from '../myinfo.adapter'

import {
  requestedAttrsToScopeString,
  userInfoToPersonResponse,
} from './myinfo.fapi.adapter'
import { getConfiguration } from './myinfo.fapi.client'
import { MYINFO_FAPI_REDIRECT_URI } from './myinfo.fapi.constants'
import {
  dpopOptions,
  generateDpopKey,
  rehydrateDpopKeyPair,
} from './myinfo.fapi.dpop'
import {
  MyInfoFapiAuthRequestError,
  MyInfoFapiConfigError,
  MyInfoFapiExchangeError,
  MyInfoFapiFetchError,
  MyInfoFapiIncompleteLoginError,
  MyInfoFapiMissingSessionError,
  MyInfoFapiMissingUinFinError,
} from './myinfo.fapi.errors'
import getMyInfoFapiSessionModel, {
  MyInfoFapiExchangedSession,
  MyInfoFapiExchangeSession,
} from './myinfo.fapi.session.model'

const logger = createLoggerWithLabel(module)
const MyInfoFapiSession = getMyInfoFapiSessionModel(mongoose)

type MyInfoFapiLoginStartResult = { sessionId: string; redirectUrl: string }
type MyInfoFapiLoginStartError =
  | MyInfoFapiConfigError
  | MyInfoFapiAuthRequestError
  | DatabaseError
type MyInfoFetchPersonError =
  | MyInfoFapiConfigError
  | MyInfoFapiFetchError
  | MyInfoFapiMissingUinFinError
type MyInfoLoadPersonForSessionError =
  | DatabaseError
  | MyInfoFapiMissingSessionError
  | MyInfoFapiIncompleteLoginError
  | MyInfoFetchPersonError

type AuthCode = {
  code: string
  state: string
  iss?: string
}

/**
 * Converts unknown OAuth failure into safe, structured logging metadata.
 * Remove .cause from error object, as it may contain sensitive MyInfo userinfo data.
 */
const oauthFailureMeta = (error: unknown): Record<string, unknown> => {
  if (!(error instanceof Error)) {
    return { thrown: String(error) }
  }
  const record = error as Error & {
    code?: unknown
    error?: unknown
    error_description?: unknown
    status?: unknown
  }
  return {
    errName: error.name,
    errMessage: error.message,
    ...(typeof record.code === 'string' || typeof record.code === 'number'
      ? { errCode: record.code }
      : {}),
    ...(typeof record.error === 'string' ? { oauthError: record.error } : {}),
    ...(typeof record.error_description === 'string'
      ? { oauthErrorDescription: record.error_description }
      : {}),
    ...(typeof record.status === 'number' ? { httpStatus: record.status } : {}),
  }
}

/**
 * Starts a FAPI login by making a PAR request, persisting the pending session in MongoDB,
 * and returning the session ID and redirect URL.
 */
export const startLogin = ({
  formId,
  encodedQuery,
  requestedAttributes,
}: {
  formId: string
  encodedQuery?: string
  requestedAttributes: MyInfoAttribute[]
}): ResultAsync<MyInfoFapiLoginStartResult, MyInfoFapiLoginStartError> => {
  const scope = requestedAttrsToScopeString(requestedAttributes)
  return withConfig(
    async (config) => {
      const codeVerifier = client.randomPKCECodeVerifier()
      const state = client.randomState()
      const nonce = client.randomNonce()
      const { keyPair, privateJwk: dpopPrivateJwk } = await generateDpopKey()
      const url = await client.buildAuthorizationUrlWithPAR(
        config,
        {
          redirect_uri: MYINFO_FAPI_REDIRECT_URI,
          response_type: 'code',
          scope,
          state,
          nonce,
          code_challenge: await client.calculatePKCECodeChallenge(codeVerifier),
          code_challenge_method: 'S256',
        },
        dpopOptions(config, keyPair),
      )
      return {
        redirectUrl: url.href,
        state,
        nonce,
        codeVerifier,
        dpopPrivateJwk,
      }
    },
    (error) => {
      const meta = {
        action: 'startLogin',
        formId,
        scope,
        redirectUri: MYINFO_FAPI_REDIRECT_URI,
        ...oauthFailureMeta(error),
      }
      logger.error({
        message: 'MyInfo FAPI pushed authorization request failed',
        meta,
      })
      return new MyInfoFapiAuthRequestError(undefined, meta)
    },
  ).andThen(({ redirectUrl, state, nonce, codeVerifier, dpopPrivateJwk }) =>
    ResultAsync.fromPromise(
      MyInfoFapiSession.createPending({
        formId,
        encodedQuery,
        state,
        nonce,
        codeVerifier,
        dpopPrivateJwk,
      }),
      (error) => {
        logger.error({
          message: 'Failed to create MyInfo FAPI login session',
          meta: { action: 'startLogin', formId },
          error,
        })
        return new DatabaseError('Failed to create MyInfo FAPI login session')
      },
    ).map((sessionId) => ({ sessionId, redirectUrl })),
  )
}

/**
 * Exchanges the authorization code for access token and subject
 * from MyInfo token exchange endpoint.
 */
export const exchangeCallback = ({
  code,
  session,
}: {
  code: AuthCode
  session: MyInfoFapiExchangeSession
}): ResultAsync<
  { accessToken: string; sub: string },
  MyInfoFapiConfigError | MyInfoFapiExchangeError
> => {
  return withConfig(
    async (config) => {
      const keyPair = await rehydrateDpopKeyPair(session.dpopPrivateJwk)
      const tokens = await client.authorizationCodeGrant(
        config,
        callbackUrl(code),
        {
          pkceCodeVerifier: session.codeVerifier,
          expectedState: session.state,
          expectedNonce: session.nonce,
          idTokenExpected: true,
        },
        undefined,
        dpopOptions(config, keyPair),
      )
      const claims = tokens.claims()
      const sub = claims ? claims.sub : undefined
      if (!sub) {
        return Promise.reject(new Error('MyInfo FAPI ID token had no sub'))
      }
      return { accessToken: tokens.access_token, sub }
    },
    (error) => {
      logger.error({
        message: 'MyInfo FAPI token exchange failed',
        meta: {
          action: 'exchangeCallback',
          formId: session.formId,
          ...oauthFailureMeta(error),
        },
      })
      return new MyInfoFapiExchangeError()
    },
  )
}

/**
 * Fetches person data from the MyInfo FAPI userinfo endpoint.
 * Uses access token, subject and DPoP private JWK to authenticate the request.
 */
export const fetchPerson = ({
  accessToken,
  sub,
  dpopPrivateJwk,
}: Pick<
  MyInfoFapiExchangedSession,
  'accessToken' | 'sub' | 'dpopPrivateJwk'
>): ResultAsync<IPersonResponse, MyInfoFetchPersonError> => {
  return withConfig(
    async (config) => {
      const keyPair = await rehydrateDpopKeyPair(dpopPrivateJwk)
      return client.fetchUserInfo(
        config,
        accessToken,
        sub,
        dpopOptions(config, keyPair),
      )
    },
    (error) => {
      logger.error({
        message: 'MyInfo FAPI userinfo request failed',
        meta: {
          action: 'fetchPerson',
          ...oauthFailureMeta(error),
        },
      })
      return new MyInfoFapiFetchError()
    },
  ).andThen(userInfoToPersonResponse)
}

/**
 * Consumes an exchanged session and retrieves its person data. A session that
 * is still pending is left untouched and reported as an incomplete login
 * rather than a failure.
 */
export const loadPersonForSession = (
  sessionId: string,
): ResultAsync<MyInfoData, MyInfoLoadPersonForSessionError> => {
  return ResultAsync.fromPromise(
    MyInfoFapiSession.consume(sessionId),
    (error) => {
      logger.error({
        message: 'Failed to consume MyInfo FAPI session',
        meta: { action: 'loadPersonForSession' },
        error,
      })
      return new DatabaseError('Failed to consume MyInfo FAPI session')
    },
  )
    .andThen((consumed) => {
      switch (consumed.status) {
        case 'exchanged':
          return okAsync(consumed.session)
        case 'failed':
          return errAsync(new MyInfoFapiMissingSessionError())
        case 'incomplete':
          return errAsync(new MyInfoFapiIncompleteLoginError())
      }
    })
    .andThen(fetchPerson)
    .map((personResponse) => new MyInfoData(personResponse))
}

const withConfig = <T, E>(
  run: (config: client.Configuration) => Promise<T>,
  onError: (error: unknown) => E,
): ResultAsync<T, MyInfoFapiConfigError | E> => {
  return getConfiguration().andThen((config) =>
    ResultAsync.fromPromise(run(config), onError),
  )
}

const callbackUrl = ({ code, state, iss }: AuthCode): URL => {
  const params = new URLSearchParams({ code, state })
  if (iss) {
    params.set('iss', iss)
  }
  const url = new URL(MYINFO_FAPI_REDIRECT_URI)
  url.search = params.toString()
  return url
}
