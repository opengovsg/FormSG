import {
  IPerson,
  IPersonResponse,
  MyInfoAttribute as AllMyInfoAttributes,
  MyInfoAttributeString,
  MyInfoGovClient,
} from '@opengovsg/myinfo-gov-client'
import Bluebird from 'bluebird'
import fs from 'fs'
import { cloneDeep } from 'lodash'
import mongoose, { LeanDocument } from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import CircuitBreaker from 'opossum'
import uuid from 'uuid'

import { createLoggerWithLabel } from '../../../config/logger'
import {
  Environment,
  IFieldSchema,
  IHashes,
  IMyInfoHashSchema,
} from '../../../types'
import { DatabaseError } from '../core/core.errors'
import { ProcessedFieldResponse } from '../submission/submission.types'

import { MYINFO_REDIRECT_PATH, MYINFO_ROUTER_PREFIX } from './myinfo.constants'
import {
  MyInfoCircuitBreakerError,
  MyInfoFetchError,
  MyInfoHashDidNotMatchError,
  MyInfoHashingError,
  MyInfoMissingHashError,
  MyInfoParseRelayStateError,
} from './myinfo.errors'
import {
  IMyInfoRedirectURLArgs,
  IMyInfoServiceConfig,
  IPossiblyPrefilledField,
  ParsedRelayState,
} from './myinfo.types'
import {
  compareHashedValues,
  createConsentPagePurpose,
  createRelayState,
  getMyInfoValue,
  hashFieldValues,
  isFieldReadOnly,
} from './myinfo.util'
import getMyInfoHashModel from './myinfo_hash.model'

const logger = createLoggerWithLabel(module)
const MyInfoHash = getMyInfoHashModel(mongoose)

const MYINFO_DEV_BASE_URL = 'http://localhost:5156/myinfo/v2/'
const BREAKER_PARAMS = {
  errorThresholdPercentage: 80, // % of errors before breaker trips
  timeout: 5000, // max time before individual request fails, ms
  rollingCountTimeout: 30000, // width of statistical window, ms
  volumeThreshold: 5, // min number of requests within statistical window before breaker trips
}

export class MyInfoService {
  /**
   * Instance of MyInfoGovClient configured with Form credentials.
   */
  #myInfoGovClient: MyInfoGovClient
  /**
   * Circuit breaker which fires requests to the MyInfo Token endpoint
   * and limits the rate of requests in case the receiving server returns errors.
   */
  #myInfoTokenBreaker: CircuitBreaker<[string], string>

  /**
   * Circuit breaker which fires requests to the MyInfo Person endpoint
   * and limits the rate of requests in case the receiving server returns errors.
   */
  #myInfoPersonBreaker: CircuitBreaker<
    [string, MyInfoAttributeString[]],
    IPersonResponse
  >

  /**
   * TTL of SingPass cookie in milliseconds.
   */
  #spCookieMaxAge: number
  #spCookieMaxAgePreserved: number

  /**
   *
   * @param myInfoConfig Environment variables including myInfoClientMode and myInfoKeyPath
   * @param nodeEnv The node environment: development, production or test
   * @param realm The realm to be passed to MyInfoGovClient
   * @param singpassEserviceId
   * @param spCookieMaxAge Validity duration of the SingPass cookie
   */
  constructor({ spcpMyInfoConfig, nodeEnv, appUrl }: IMyInfoServiceConfig) {
    this.#spCookieMaxAge = spcpMyInfoConfig.spCookieMaxAge
    this.#spCookieMaxAgePreserved = spcpMyInfoConfig.spCookieMaxAgePreserved

    this.#myInfoGovClient = new MyInfoGovClient({
      singpassEserviceId: spcpMyInfoConfig.spEsrvcId,
      clientPrivateKey: fs.readFileSync(spcpMyInfoConfig.myInfoKeyPath),
      myInfoPublicKey: fs.readFileSync(spcpMyInfoConfig.myInfoCertPath),
      clientId: spcpMyInfoConfig.myInfoClientId,
      clientSecret: spcpMyInfoConfig.myInfoClientSecret,
      redirectEndpoint: `${appUrl}${MYINFO_ROUTER_PREFIX}${MYINFO_REDIRECT_PATH}`,
      mode: spcpMyInfoConfig.myInfoClientMode,
    })
    if (nodeEnv !== Environment.Prod) {
      this.#myInfoGovClient.baseAPIUrl = MYINFO_DEV_BASE_URL
    }
    this.#myInfoTokenBreaker = new CircuitBreaker(
      (authCode) => this.#myInfoGovClient.getAccessToken(authCode),
      BREAKER_PARAMS,
    )
    this.#myInfoPersonBreaker = new CircuitBreaker((accessToken, attributes) =>
      this.#myInfoGovClient.getPerson(accessToken, attributes),
    )
  }

  createRedirectURL({
    formId,
    rememberMe,
    formTitle,
    formEsrvcId,
    requestedAttributes,
  }: IMyInfoRedirectURLArgs): Result<string, never> {
    const redirectURL = this.#myInfoGovClient.createRedirectURL({
      purpose: createConsentPagePurpose(formTitle),
      relayState: createRelayState(formId, rememberMe),
      // Always request consent for NRIC/FIN
      requestedAttributes: requestedAttributes.concat([
        AllMyInfoAttributes.UinFin,
      ]),
      singpassEserviceId: formEsrvcId,
    })
    return ok(redirectURL)
  }

  parseMyInfoRelayState(
    relayState: string,
  ): Result<ParsedRelayState, MyInfoParseRelayStateError> {
    const components = relayState.split(',')
    if (
      components.length !== 3 ||
      !uuid.validate(components[0]) ||
      !mongoose.Types.ObjectId.isValid(components[1]) ||
      !['true', 'false'].includes(components[2])
    ) {
      return err(new MyInfoParseRelayStateError())
    }
    const rememberMe = components[2] === 'true'
    return ok({
      uuid: components[0],
      formId: components[1],
      rememberMe,
      cookieDuration: rememberMe
        ? this.#spCookieMaxAgePreserved
        : this.#spCookieMaxAge,
    })
  }

  retrieveAccessToken(
    authCode: string,
  ): ResultAsync<string, MyInfoCircuitBreakerError | MyInfoFetchError> {
    return ResultAsync.fromPromise(
      this.#myInfoTokenBreaker.fire(authCode),
      (error) => {
        const logMeta = {
          action: 'retrieveAccessToken',
        }
        if (CircuitBreaker.isOurError(error)) {
          logger.error({
            message: 'Circuit breaker tripped',
            meta: logMeta,
            error,
          })
          return new MyInfoCircuitBreakerError()
        } else {
          logger.error({
            message: 'Error retrieving data from MyInfo',
            meta: logMeta,
            error,
          })
          return new MyInfoFetchError()
        }
      },
    )
  }

  /**
   * Fetches MyInfo person detail with given params.
   * This function has circuit breaking built into it, and will throw an error
   * if any recent usages of this function returned an error.
   * @param params The params required to retrieve the data.
   * @param params.uinFin The uin/fin of the person's data to retrieve.
   * @param params.requestedAttributes The requested attributes to fetch.
   * @param params.singpassEserviceId The eservice id of the form requesting the data.
   * @returns the person object retrieved.
   * @throws an error on fetch failure or if circuit breaker is in the opened state. Use {@link CircuitBreaker#isOurError} to determine if a rejection was a result of the circuit breaker or the action.
   */
  fetchMyInfoPersonData(
    accessToken: string,
    requestedAttributes: MyInfoAttributeString[],
  ): ResultAsync<
    IPersonResponse,
    MyInfoCircuitBreakerError | MyInfoFetchError
  > {
    return ResultAsync.fromPromise(
      this.#myInfoPersonBreaker.fire(accessToken, requestedAttributes),
      (error) => {
        const logMeta = {
          action: 'fetchMyInfoPersonData',
          requestedAttributes,
        }
        if (CircuitBreaker.isOurError(error)) {
          logger.error({
            message: 'Circuit breaker tripped',
            meta: logMeta,
            error,
          })
          return new MyInfoCircuitBreakerError()
        } else {
          logger.error({
            message: 'Error retrieving data from MyInfo',
            meta: logMeta,
            error,
          })
          return new MyInfoFetchError()
        }
      },
    )
  }

  /**
   * Prefill given current form fields with given MyInfo data.
   * @param myInfoData
   * @param currFormFields
   * @returns currFormFields with the MyInfo fields prefilled with data from myInfoData
   */
  prefillMyInfoFields(
    myInfoData: IPerson,
    currFormFields: LeanDocument<IFieldSchema[]>,
  ): Result<IPossiblyPrefilledField[], never> {
    const prefilledFields = currFormFields.map((field) => {
      if (!field.myInfo?.attr) return field

      const myInfoAttr = field.myInfo.attr
      const myInfoValue = getMyInfoValue(myInfoAttr, myInfoData)
      const isReadOnly = isFieldReadOnly(myInfoAttr, myInfoValue, myInfoData)
      const prefilledField = cloneDeep(field) as IPossiblyPrefilledField
      prefilledField.fieldValue = myInfoValue

      // Disable field
      prefilledField.disabled = isReadOnly
      return prefilledField
    })
    return ok(prefilledFields)
  }

  /**
   * Saves hashed prefilled values of MyInfo fields.
   * @param uinFin NRIC
   * @param formId ID of form being populated
   * @param prefilledFormFields Fields with fieldValue prefilled and disabled set to true if read-only
   * @returns the document saved to the database which contains the hashes, or null if the document was not found
   * @throws error if an error occurred while hashing the values or updating the database
   */
  saveMyInfoHashes(
    uinFin: string,
    formId: string,
    prefilledFormFields: IPossiblyPrefilledField[],
  ): ResultAsync<IMyInfoHashSchema | null, MyInfoHashingError | DatabaseError> {
    const readOnlyHashPromises = hashFieldValues(prefilledFormFields)
    return ResultAsync.fromPromise(
      Bluebird.props<IHashes>(readOnlyHashPromises),
      (error) => {
        logger.error({
          message: 'Failed to hash MyInfo values',
          meta: {
            action: 'saveMyInfoHashes',
            myInfoAttributes: Object.keys(readOnlyHashPromises),
          },
          error,
        })
        return new MyInfoHashingError()
      },
    ).andThen((readOnlyHashes: IHashes) => {
      return ResultAsync.fromPromise(
        MyInfoHash.updateHashes(
          uinFin,
          formId,
          readOnlyHashes,
          this.#spCookieMaxAge,
        ),
        (error) => {
          const message = 'Failed to save MyInfo hashes to database'
          logger.error({
            message,
            meta: {
              action: 'saveMyInfoHashes',
              myInfoAttributes: Object.keys(readOnlyHashPromises),
            },
            error,
          })
          return new DatabaseError(message)
        },
      )
    })
  }

  /**
   * Fetches the saved hashes for a given MyInfo form and user.
   * @param uinFin NRIC
   * @param formId ID of form being checked
   * @returns an object mapping MyInfo attributes to their respective saved hashes
   * @throws error if there was an error while querying the database or the requested hashes were not found
   */
  fetchMyInfoHashes(
    uinFin: string,
    formId: string,
  ): ResultAsync<IHashes, DatabaseError | MyInfoMissingHashError> {
    return ResultAsync.fromPromise(
      MyInfoHash.findHashes(uinFin, formId),
      (error) => {
        const message = 'Error while fetching MyInfo hashes from database'
        logger.error({
          message,
          meta: {
            action: 'fetchMyInfoHashes',
          },
          error,
        })
        return new DatabaseError(message)
      },
    ).andThen((hashes) => {
      if (hashes) {
        return okAsync(hashes)
      } else {
        logger.info({
          message: 'MyInfo hashes expired',
          meta: {
            action: 'fetchMyInfoHashes',
            formId,
          },
        })
      }
      return errAsync(new MyInfoMissingHashError())
    })
  }

  /**
   * Checks that the given responses match the given hashes.
   * @param responses Fields processed with the isVisible attribute
   * @param hashes MyInfo value hashes retrieved from the database
   * @returns the set of field IDs which were verified using their hashes
   * @throws if an error occurred while comparing the responses and their hashes, or if any
   * hash did not match the submitted value
   */
  checkMyInfoHashes(
    responses: ProcessedFieldResponse[],
    hashes: IHashes,
  ): ResultAsync<Set<string>, MyInfoHashingError | MyInfoHashDidNotMatchError> {
    const comparisonPromises = compareHashedValues(responses, hashes)
    return ResultAsync.fromPromise(
      Bluebird.props(comparisonPromises),
      (error) => {
        logger.error({
          message: 'Error while comparing MyInfo hashes',
          meta: {
            action: 'checkMyInfoHashes',
          },
          error,
        })
        return new MyInfoHashingError()
      },
    ).andThen((comparisonResults) => {
      const comparedFieldIds = Array.from(comparisonResults.keys())
      // All outcomes should be true
      const failedFieldIds = comparedFieldIds.filter(
        (attr) => !comparisonResults.get(attr),
      )
      if (failedFieldIds.length > 0) {
        logger.error({
          message: 'MyInfo Hash did not match',
          meta: {
            action: 'checkMyInfoHashes',
            failedFields: failedFieldIds,
          },
        })
        return errAsync(new MyInfoHashDidNotMatchError())
      }
      return okAsync(new Set(comparedFieldIds))
    })
  }
}
