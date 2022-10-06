import axios from 'axios'
import { createPrivateKey, createPublicKey, KeyObject } from 'crypto'
import {
  compactDecrypt,
  decodeProtectedHeader,
  JWTPayload,
  jwtVerify,
  JWTVerifyResult,
  SignJWT,
} from 'jose'
import jwkToPem from 'jwk-to-pem'
import { BaseClient, TokenSet } from 'openid-client'
import { ulid } from 'ulid'
import { URLSearchParams } from 'url'

import { FormAuthType } from '../../../../shared/types'

import { SpcpOidcBaseClientCache } from './spcp.oidc.client.cache'
import {
  CreateAuthorisationUrlError,
  CreateJwtError,
  ExchangeAuthTokenError,
  GetDecryptionKeyError,
  GetSigningKeyError,
  GetVerificationKeyError,
  InvalidIdTokenError,
  JwkError,
  MissingIdTokenError,
  VerificationKeyError,
} from './spcp.oidc.client.errors'
import {
  CryptoKeys,
  SigningKey,
  SpClientIdField,
  SpcpOidcClientConstructorParams,
} from './spcp.oidc.client.types'
import {
  extractNricOrForeignIdFromParsedSub,
  isCPJWTVerifyResult,
  isEC,
  isECPrivate,
  isSigningKey,
  parseSub,
} from './spcp.oidc.util'

/**
 * Wrapper around the openid-client library to carry out authentication related tasks with Singpass and Corppass NDI,
 * and provides methods for decryption and verification of JWE/JWS returned by NDI after authorisation code exchange.
 * This is a base class for the Singpass and CorpPass OIDC client classes and is not meant to be instantiated on its own.
 * @parent for SpOidcClient and CpOidcClient classes
 * Exported for testing.
 */
export abstract class SpcpOidcBaseClient {
  #rpSecretKeys: CryptoKeys
  #rpPublicKeys: CryptoKeys
  #rpRedirectUrl: string
  rpClientId: string
  abstract eServiceIdKey: string

  /**
   * @private
   * accessible only for testing
   */
  _spcpOidcBaseClientCache: SpcpOidcBaseClientCache

  /**
   * Constructor for client
   * @param config
   * @throws JwkError if RP's secret or public keys are not of correct shape
   */
  constructor({
    rpClientId,
    rpRedirectUrl,
    ndiDiscoveryEndpoint,
    ndiJwksEndpoint,
    rpSecretJwks,
    rpPublicJwks,
  }: SpcpOidcClientConstructorParams) {
    this._spcpOidcBaseClientCache = new SpcpOidcBaseClientCache({
      ndiDiscoveryEndpoint,
      ndiJwksEndpoint,
      rpClientId,
      rpRedirectUrl,
      rpSecretJwks,
      options: {
        useClones: false,
        checkperiod: 60, // Check cache expiry every 60 seconds
      },
    })

    this.#rpRedirectUrl = rpRedirectUrl
    this.rpClientId = rpClientId

    this.#rpSecretKeys = rpSecretJwks.keys.map((jwk) => {
      if (!jwk.alg) {
        throw new JwkError('alg attribute not present on rp secret jwk')
      }

      if (!isECPrivate(jwk)) {
        throw new JwkError()
      }

      const cryptoKeys = {
        kid: jwk.kid,
        use: jwk.use,
        alg: jwk.alg,
        // Conversion to pem is necessary because in node 14, crypto does not support import of JWK directly
        // TODO (#4021): load JWK directly after node upgrade
        key: createPrivateKey(jwkToPem(jwk, { private: true })),
      }

      return cryptoKeys
    })

    this.#rpPublicKeys = rpPublicJwks.keys.map((jwk) => {
      if (!jwk.alg) {
        throw new JwkError('alg attribute not present on rp public jwk')
      }

      if (!isEC(jwk)) {
        throw new JwkError()
      }

      const cryptoKeys = {
        kid: jwk.kid,
        use: jwk.use,
        alg: jwk.alg,
        // Conversion to pem is necessary because in node 14, crypto does not support import of JWK directly
        // TODO (#4021): load JWK directly after node upgrade
        key: createPublicKey(jwkToPem(jwk)),
      }

      return cryptoKeys
    })
  }

  /**
   * Method to retrieve NDI's public keys from cache
   * @async
   * @returns NDI's Public Key
   * @throws error if this._spcpOidcBaseClientCache.getNdiPublicKeys() rejects
   */
  async getNdiPublicKeysFromCache(): Promise<CryptoKeys> {
    return this._spcpOidcBaseClientCache.getNdiPublicKeys()
  }

  /**
   * Method to retrieve baseClient from cache
   * @async
   * @returns baseClient from discovery of NDI's discovery endpoint
   * @throws error if this._spcpOidcBaseClientCache.getBaseClient() rejects
   */
  async getBaseClientFromCache(): Promise<BaseClient> {
    return this._spcpOidcBaseClientCache.getBaseClient()
  }

  /**
   * Method to generate url to SP/CP login page for authorisation
   * @param state - contains formId, remember me, and stored queryId
   * @param esrvcId - eServiceId
   * @return authorisation url
   * @throws CreateAuthorisationUrlError if state or esrvcId is undefined
   */
  async createAuthorisationUrl(
    state: string,
    esrvcId: string,
  ): Promise<string> {
    if (!state) {
      throw new CreateAuthorisationUrlError(
        'Empty state, failed to create redirect url.',
      )
    }
    if (!esrvcId) {
      throw new CreateAuthorisationUrlError(
        'Empty esrvcId, failed to create redirect url.',
      )
    }

    const baseClient = await this.getBaseClientFromCache()

    const authorisationUrl = baseClient.authorizationUrl({
      scope: 'openid',
      response_type: 'code',
      state: state,
      nonce: ulid(), // Not used - nonce is a required parameter for SPCP's OIDC implementation although it is optional in OIDC specs
      [this.eServiceIdKey]: esrvcId,
    })

    return authorisationUrl
  }

  /**
   * Method to select the correct decryption key based on kid value of jwe
   * @param jwe
   * @param keys keys to choose from
   * @returns decryptKey
   * @returns GetDecryptionKeyError if unable to find decryption key
   */
  getDecryptionKey(
    jwe: string,
    keys: CryptoKeys,
  ): KeyObject | GetDecryptionKeyError {
    // Choose the correct decryption key for the jwe
    if (!jwe) {
      return new GetDecryptionKeyError('jwe is empty')
    }

    const { kid } = decodeProtectedHeader(jwe)

    if (!kid) {
      return new GetDecryptionKeyError(
        'getDecryptionKey failed, no kid in idToken JWE',
      )
    }
    const possibleDecryptKeys = keys.filter((key) => key.kid === kid)
    if (possibleDecryptKeys.length === 0) {
      return new GetDecryptionKeyError(
        'getDecryptionKey failed, no decryption key matches jwe kid',
      )
    }
    const decryptKey = possibleDecryptKeys[0].key
    return decryptKey
  }

  /**
   * Method to select the correct verification key based on kid value of jws
   * @param jws
   * @param keys keys to choose from
   * @returns verificationKey
   * @returns GetVerificationKeyError is unable to find verification key
   */
  getVerificationKey(
    jws: string,
    keys: CryptoKeys,
  ): KeyObject | GetVerificationKeyError {
    if (!jws) {
      return new GetVerificationKeyError('jws is empty')
    }

    const { kid } = decodeProtectedHeader(jws)
    if (!kid) {
      return new GetVerificationKeyError(
        'getVerificationKey failed, no kid in JWS',
      )
    }

    const possibleVerificationKeys = keys.filter((key) => key.kid === kid)
    if (possibleVerificationKeys.length === 0) {
      return new GetVerificationKeyError(
        'getVerificationKey failed, no verification key matches jws kid',
      )
    }
    const verificationKey = possibleVerificationKeys[0].key

    return verificationKey
  }

  /**
   * Optional method to inject additional fields into token exchange request
   * @returns Object with string key and properties
   */

  getExtraTokenFields(): { [key: string]: string } {
    return {}
  }

  /**
   * Method to exchange authorisation code for idToken from NDI and then decode and verify it
   * @async
   * @param authCode authorisation code provided from browser after authorisation
   * @returns Decoded and verified idToken
   * @throws MissingIdTokenError if id token is missing in tokenSet
   * @throws GetDecryptionKeyError if unable to retrieve decryption key
   * @throws GetVerificationKeyError if unable to retrieve verification key
   * @throws ExchangeAuthTokenError if exchange fails for any other reason
   */
  async exchangeAuthCodeAndDecodeVerifyToken(
    authCode: string,
  ): Promise<JWTVerifyResult> {
    if (!authCode) {
      throw new ExchangeAuthTokenError('empty authCode')
    }

    const baseClient = await this.getBaseClientFromCache()

    const tokenEndpoint = baseClient.issuer.metadata.token_endpoint

    if (!tokenEndpoint) {
      throw new ExchangeAuthTokenError(
        'Failed to exchange Auth Code, no token endpoint in issuer metadata',
      )
    }

    try {
      // Exchange Auth Code for tokenSet
      // We use axios because openid-client library 1) does not include typ attribute in header
      // which is required by NDI and 2) constructs aud claim as an array, instead of string
      // as required by NDI

      // Create client assertion
      const clientAssertion = await this.createJWT(
        {
          iss: this.rpClientId,
          aud: baseClient.issuer.metadata.issuer,
          sub: this.rpClientId,
        },
        '60s',
      )

      // Construct request body. It is necessary to stringify the body because
      // SP/CP OIDC requires content type to be application/x-www-form-urlencoded
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        redirect_uri: this.#rpRedirectUrl,
        code: authCode,
        client_assertion_type:
          'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
        ...this.getExtraTokenFields(),
      }).toString()

      const { data } = await axios.post<TokenSet>(tokenEndpoint, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const { id_token: idToken } = data

      if (!idToken) {
        throw new MissingIdTokenError()
      }

      // Get the correct decryption key
      const decryptKeyResult = this.getDecryptionKey(
        idToken,
        this.#rpSecretKeys,
      )
      if (decryptKeyResult instanceof GetDecryptionKeyError) {
        throw decryptKeyResult
      }

      // Decrypt using decryption key
      const decoder = new TextDecoder()

      const decryptedIdToken = await compactDecrypt(
        idToken,
        decryptKeyResult,
      ).then((result) => decoder.decode(result.plaintext))

      // Choose the correct verification key for the jws
      const ndiPublicKeys = await this.getNdiPublicKeysFromCache()

      const verificationKeyResult = this.getVerificationKey(
        decryptedIdToken,
        ndiPublicKeys,
      )

      if (verificationKeyResult instanceof GetVerificationKeyError) {
        throw verificationKeyResult
      }

      // Verify using verification key
      const verifiedIdToken = await jwtVerify(
        decryptedIdToken,
        verificationKeyResult,
      )

      return verifiedIdToken
    } catch (err) {
      // If any error in the exchange, trigger refresh of cache. Possible sources of failure are:
      // NDI changed /token endpoint url, hence need to rediscover well-known endpoint
      // NDI changed the signing keys without broadcasting both old and new keys for the 1h cache duration, hence need to refetch keys
      void this._spcpOidcBaseClientCache.refresh()
      if (err instanceof Error) {
        throw err
      } else {
        throw new ExchangeAuthTokenError()
      }
    }
  }

  /**
   * Method to extract NRIC or Foreign ID from decrypted and verified idToken
   * @param idToken decrypted and verified idToken
   * @returns nric or foreign id string
   * @returns InvalidIdTokenError if nric or foreign id not found in idToken
   */
  extractNricOrForeignIdFromIdToken(
    idToken: JWTVerifyResult,
  ): string | InvalidIdTokenError {
    if (!idToken.payload.sub) {
      return new InvalidIdTokenError('sub attribute missing in idToken payload')
    }

    const parsedSub = parseSub(idToken.payload.sub)

    if (parsedSub instanceof InvalidIdTokenError) {
      return parsedSub
    }

    const nricOrForeignId = extractNricOrForeignIdFromParsedSub(parsedSub)

    if (!nricOrForeignId) {
      return new InvalidIdTokenError(
        'NRIC or Foreign Id not found in idToken payload sub attribute',
      )
    }

    return nricOrForeignId
  }

  /**
   * Selects the first of RP's signing keys from #rpSecretKeys
   * @return One RP's signing key
   * @returns GetSigningKeyError if no signing keys found in RP's secret keys
   */
  getSigningKey(): SigningKey | GetSigningKeyError {
    const possibleSigningKeys = this.#rpSecretKeys.filter(
      (key): key is SigningKey => isSigningKey(key),
    )

    if (possibleSigningKeys.length === 0) {
      return new GetSigningKeyError('No signing keys found.')
    }

    const signingKey = possibleSigningKeys[0] // Can use any of the RP's secret keys. For key rotation, we need to expose the RP's old + new public signing keys for 1h (to allow NDI to refresh cache), and then load only the new secret signing key on our servers.

    return signingKey
  }

  /**
   * Creates a JSON Web Token (JWT) for a web session authenticated by SingPass/Corppass
   * Also used to sign client assertion for token exchange
   * @param  payload - Payload to sign
   * @param  expiresIn - The lifetime of the jwt token
   * @return the created JWT
   * @throws CreateJwtError if no signing keys found in RP's secret keys
   */
  async createJWT(
    payload: Record<string, unknown>,
    expiresIn: string | number,
  ): Promise<string> {
    const signingKeyResult = this.getSigningKey()

    if (signingKeyResult instanceof GetSigningKeyError) {
      throw new CreateJwtError('Failed to create JWT, no signing key found')
    }

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({
        typ: 'JWT',
        alg: signingKeyResult.alg,
        kid: signingKeyResult.kid,
      })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(signingKeyResult.key)

    return jwt
  }

  /**
   * Verifies a JWT for SingPass/Corppass authenticated session
   * @param  jwt - The JWT to verify
   * @return the decoded payload
   * @throws VerificationKeyError if no verification key found
   */
  async verifyJwt(jwt: string): Promise<JWTPayload> {
    const verificationKeyResult = this.getVerificationKey(
      jwt,
      this.#rpPublicKeys,
    )
    if (verificationKeyResult instanceof GetVerificationKeyError) {
      throw new VerificationKeyError(
        'Verify JWT failed, no verification key found',
      )
    }

    const { payload } = await jwtVerify(jwt, verificationKeyResult)

    return payload
  }
}

/**
 * Singpass OIDC Client
 * @extends SpcpOidcBaseClient
 */
export class SpOidcClient extends SpcpOidcBaseClient {
  authType = FormAuthType.SP
  eServiceIdKey = 'esrvc'

  constructor(params: SpcpOidcClientConstructorParams) {
    super(params)
  }

  /**
   * Method to inject client ID when sending the token exchange request for singpass oidc
   */

  getExtraTokenFields(): SpClientIdField {
    return { client_id: this.rpClientId }
  }
}

/**
 * Corppass OIDC Client
 * @extends SpcpOidcBaseClient
 */
export class CpOidcClient extends SpcpOidcBaseClient {
  authType = FormAuthType.CP
  eServiceIdKey = 'esrvcID'

  constructor(params: SpcpOidcClientConstructorParams) {
    super(params)
  }

  /**
   * Method to extract Entity ID from decrypted and verified Corppass idToken
   * From NDI CP Specs: EntityInfo object is a mandatory claim in all Corppass id tokens.
   * CPEntID is a mandatory attribute in EntityInfo.
   * Mandatory attributes in the object will always contain values (could be blank string).
   * @param idToken decrypted and verified CP idToken
   * @returns Entity ID (UEN or NON-UEN ID) of the entity to which the user belongs in Corppass.
   * @returns InvalidIdTokenError if CPEntID attribute is empty
   */
  extractCPEntityIdFromIdToken(
    idToken: JWTVerifyResult,
  ): string | InvalidIdTokenError {
    if (!isCPJWTVerifyResult(idToken)) {
      return new InvalidIdTokenError('idToken has incorrect shape.')
    }

    if (!idToken.payload.entityInfo.CPEntID) {
      return new InvalidIdTokenError('CPEntID attribute is empty string.')
    }

    return idToken.payload.entityInfo.CPEntID
  }
}
