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
import {
  exportPrivateJwk,
  getConfiguration,
  importEcSigningKey,
  importEcVerificationKey,
} from './myinfo.fapi.client'
import { MYINFO_FAPI_REDIRECT_URI } from './myinfo.fapi.constants'
import {
  MyInfoFapiAuthRequestError,
  MyInfoFapiConfigError,
  MyInfoFapiExchangeError,
  MyInfoFapiFetchError,
  MyInfoFapiMissingSessionError,
  MyInfoFapiMissingUinFinError,
} from './myinfo.fapi.errors'
import getMyInfoFapiSessionModel, {
  MyInfoFapiExchangedSession,
  MyInfoFapiExchangeSession,
  MyInfoFapiPendingSession,
} from './myinfo.fapi.session.model'

/**
 * DPoP should be ≤2 minutes after iat
 * @see {@link https://docs.developer.singpass.gov.sg/docs/technical-specifications/technical-concepts/demonstrating-proof-of-possession-dpop}
 */
const DPOP_EXPIRY_SECONDS = 120

const logger = createLoggerWithLabel(module)
const MyInfoFapiSession = getMyInfoFapiSessionModel(mongoose)

/**
 * Identifying fields only. oauth4webapi `.cause` can be a full userinfo body,
 * and a plain object in the logger `error:` slot is dropped by the JSON formatter.
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

type MyInfoFapiLoginStart = Pick<
  MyInfoFapiPendingSession,
  'state' | 'nonce' | 'codeVerifier' | 'dpopPrivateJwk'
> & { redirectUrl: string }

type AuthCode = {
  code: string
  state: string
  iss?: string
}

/**
 * Starts a FAPI login: pushes the authorization request and persists the
 * pending session. The protocol secrets (state, nonce, PKCE verifier, DPoP
 * private key) never leave this module; callers get an opaque session id
 * and the URL to send the respondent to.
 * @param formId - The form ID.
 * @param encodedQuery - The encoded query.
 * @param requestedAttributes - The requested attributes.
 * @returns The session ID and redirect URL.
 */
export const startLogin = ({
  formId,
  encodedQuery,
  requestedAttributes,
}: {
  formId: string
  encodedQuery?: string
  requestedAttributes: MyInfoAttribute[]
}): ResultAsync<
  { sessionId: string; redirectUrl: string },
  MyInfoFapiConfigError | MyInfoFapiAuthRequestError | DatabaseError
> => {
  return buildLoginUrl({
    formId,
    scope: requestedAttrsToScopeString(requestedAttributes),
  }).andThen(({ redirectUrl, state, nonce, codeVerifier, dpopPrivateJwk }) =>
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
 * Pushes an authorization request and returns the URL to send the respondent to,
 * along with the state that must survive the redirect.
 * @param formId - The form ID.
 * @param scope - The scope.
 * @returns The login start.
 */
const buildLoginUrl = ({
  formId,
  scope,
}: {
  formId: string
  scope: string
}): ResultAsync<
  MyInfoFapiLoginStart,
  MyInfoFapiConfigError | MyInfoFapiAuthRequestError
> => {
  return withConfig(
    async (config) => {
      const codeVerifier = client.randomPKCECodeVerifier()
      const state = client.randomState()
      const nonce = client.randomNonce()
      const keyPair = await client.randomDPoPKeyPair('ES256', {
        extractable: true,
      })
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
        dpopPrivateJwk: await exportPrivateJwk(keyPair.privateKey),
      }
    },
    (error) => {
      const meta = {
        action: 'buildLoginUrl',
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
  )
}

/**
 * Exchanges the authorization code for tokens. openid-client verifies `iss`,
 * `state`, `nonce` and PKCE and decrypts the ID token, so none of that is repeated here.
 * @param code - The authorization code.
 * @param session - The pending session.
 * @returns The access token and subject.
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
        // eslint-disable-next-line typesafe/no-throw-sync-func
        throw new Error('MyInfo FAPI ID token had no sub')
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
 * @param accessToken - The access token.
 * @param sub - The subject.
 * @param dpopPrivateJwk - The DPoP private JWK.
 * @returns The person data.
 */
export const fetchPerson = ({
  accessToken,
  sub,
  dpopPrivateJwk,
}: Pick<
  MyInfoFapiExchangedSession,
  'accessToken' | 'sub' | 'dpopPrivateJwk'
>): ResultAsync<
  IPersonResponse,
  MyInfoFapiConfigError | MyInfoFapiFetchError | MyInfoFapiMissingUinFinError
> => {
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
 * Consumes an exchanged login session and loads the person data it grants.
 * @param sessionId - The session ID.
 * @returns The person data.
 */
export const loadPersonForSession = (
  sessionId: string,
): ResultAsync<
  MyInfoData,
  | DatabaseError
  | MyInfoFapiMissingSessionError
  | MyInfoFapiConfigError
  | MyInfoFapiFetchError
  | MyInfoFapiMissingUinFinError
> => {
  return ResultAsync.fromPromise(
    MyInfoFapiSession.consumeExchanged(sessionId),
    (error) => {
      logger.error({
        message: 'Failed to consume MyInfo FAPI session',
        meta: { action: 'loadPersonForSession', sessionId },
        error,
      })
      return new DatabaseError('Failed to consume MyInfo FAPI session')
    },
  )
    .andThen((session) => {
      if (!session) {
        return errAsync(new MyInfoFapiMissingSessionError())
      }
      return okAsync(session)
    })
    .andThen(fetchPerson)
    .map((personResponse) => new MyInfoData(personResponse))
}

// Private functions

const withConfig = <T, E>(
  run: (config: client.Configuration) => Promise<T>,
  onError: (error: unknown) => E,
): ResultAsync<T, MyInfoFapiConfigError | E> => {
  return getConfiguration().andThen((config) =>
    ResultAsync.fromPromise(run(config), onError),
  )
}

const dpopOptions = (
  config: client.Configuration,
  keyPair: CryptoKeyPair,
): client.DPoPOptions => {
  return {
    DPoP: client.getDPoPHandle(config, keyPair, {
      [client.modifyAssertion]: (_header, payload) => {
        if (typeof payload.iat === 'number') {
          payload.exp = payload.iat + DPOP_EXPIRY_SECONDS
        }
      },
    }),
  }
}

const rehydrateDpopKeyPair = async (
  jwk: JsonWebKey,
): Promise<CryptoKeyPair> => {
  const privateKey = await importEcSigningKey(jwk)
  const publicKey = await importEcVerificationKey(jwk)
  return { privateKey, publicKey }
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
