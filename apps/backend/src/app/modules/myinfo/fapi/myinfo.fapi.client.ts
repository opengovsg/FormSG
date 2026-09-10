import { ResultAsync } from 'neverthrow'
import * as client from 'openid-client'

import config from '../../../config/config'
import { spcpMyInfoConfig } from '../../../config/features/spcp-myinfo.config'
import { createLoggerWithLabel } from '../../../config/logger'

import { MyInfoFapiConfigError } from './myinfo.fapi.errors'
import { loadSecretKeys } from './myinfo.fapi.jwks'

const logger = createLoggerWithLabel(module)

const REQUEST_TIMEOUT_SECONDS = 10
const CONTENT_ENCRYPTION_ALGORITHMS = ['A256CBC-HS512', 'A256GCM']

let configResult:
  | ResultAsync<client.Configuration, MyInfoFapiConfigError>
  | undefined

/**
 * Retrieves and validates the MyInfo FAPI client configuration from discovery endpoint.
 * Caches the result for subsequent calls.
 */
export const getConfiguration = (): ResultAsync<
  client.Configuration,
  MyInfoFapiConfigError
> => {
  if (!configResult) {
    configResult = buildConfiguration().mapErr((error) => {
      configResult = undefined
      return error
    })
  }
  return configResult
}

/**
 * Get MyInfo FAPI client configuration from discovery endpoint.
 * See https://docs.developer.singpass.gov.sg/docs/technical-specifications/technical-concepts/openid-connect-discovery
 */
const buildConfiguration = (): ResultAsync<
  client.Configuration,
  MyInfoFapiConfigError
> =>
  loadSecretKeys().andThen((keys) =>
    ResultAsync.fromPromise(
      (async () => {
        const configuration = await client.discovery(
          new URL(spcpMyInfoConfig.myInfoFapiIssuer),
          spcpMyInfoConfig.myInfoFapiClientId,
          undefined,
          client.PrivateKeyJwt(
            { key: keys.signingKey, kid: keys.sigKid },
            {
              // Singpass rejects a client assertion without typ
              [client.modifyAssertion]: (header) => {
                header.typ = 'JWT'
              },
            },
          ),
          {
            timeout: REQUEST_TIMEOUT_SECONDS,
            execute: config.isDevOrTest ? [client.allowInsecureRequests] : [],
          },
        )
        // Used to decrypt JWE/JWS response from MyInfo (id token, user info)
        client.enableDecryptingResponses(
          configuration,
          CONTENT_ENCRYPTION_ALGORITHMS,
          {
            key: keys.decryptionKey,
            alg: keys.encAlg,
            kid: keys.encKid,
          },
        )
        logger.info({
          message: 'Initialised MyInfo FAPI client',
          meta: { action: 'getConfiguration' },
        })
        return configuration
      })(),
      (error) => {
        logger.error({
          message: 'MyInfo FAPI client discovery failed',
          meta: { action: 'getConfiguration' },
          error,
        })
        return new MyInfoFapiConfigError()
      },
    ),
  )
