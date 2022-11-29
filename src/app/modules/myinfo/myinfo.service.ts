import {
  IPersonResponse,
  MyInfoGovClient,
  MyInfoScope,
} from '@opengovsg/myinfo-gov-client'
import Bluebird from 'bluebird'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import { cloneDeep } from 'lodash'
import mongoose, { LeanDocument } from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import CircuitBreaker from 'opossum'

import {
  Environment,
  IFieldSchema,
  IHashes,
  IMyInfoHashSchema,
  IPopulatedForm,
  PossiblyPrefilledField,
} from '../../../types'
import config from '../../config/config'
import { spcpMyInfoConfig } from '../../config/features/spcp-myinfo.config'
import { createLoggerWithLabel } from '../../config/logger'
import { DatabaseError } from '../core/core.errors'
import {
  AuthTypeMismatchError,
  FormAuthNoEsrvcIdError,
} from '../form/form.errors'
import { ProcessedFieldResponse } from '../submission/submission.types'

import { internalAttrListToScopes, MyInfoData } from './myinfo.adapter'
import {
  MYINFO_CONSENT_PAGE_PURPOSE,
  MYINFO_REDIRECT_PATH,
  MYINFO_ROUTER_PREFIX,
} from './myinfo.constants'
import {
  MyInfoCircuitBreakerError,
  MyInfoFetchError,
  MyInfoHashDidNotMatchError,
  MyInfoHashingError,
  MyInfoInvalidLoginCookieError,
  MyInfoMissingHashError,
  MyInfoMissingLoginCookieError,
  MyInfoParseRelayStateError,
} from './myinfo.errors'
import {
  IMyInfoRedirectURLArgs,
  IMyInfoServiceConfig,
  MyInfoLoginCookiePayload,
  MyInfoRelayState,
} from './myinfo.types'
import {
  compareHashedValues,
  createRelayState,
  extractAndAssertOldMyInfoCookieValidity,
  extractMyInfoLoginJwt,
  hashFieldValues,
  isMyInfoLoginCookie,
  isMyInfoRelayState,
  validateMyInfoForm,
} from './myinfo.util'
import getMyInfoHashModel from './myinfo_hash.model'

const logger = createLoggerWithLabel(module)
const MyInfoHash = getMyInfoHashModel(mongoose)

const MYINFO_DEV_BASE_URL = 'http://localhost:5156/myinfo/v3'
const BREAKER_PARAMS = {
  errorThresholdPercentage: 80, // % of errors before breaker trips
  timeout: 5000, // max time before individual request fails, ms
  rollingCountTimeout: 30000, // width of statistical window, ms
  volumeThreshold: 5, // min number of requests within statistical window before breaker trips
}

/**
 * Class for managing MyInfo-related functionality.
 * Exported for testing.
 */
export class MyInfoServiceClass {
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
    [string, MyInfoScope[], string],
    IPersonResponse
  >

  /**
   * TTL of SingPass cookie in milliseconds.
   */
  #spCookieMaxAge: number

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
    this.#myInfoPersonBreaker = new CircuitBreaker(
      (accessToken, attributes, eSrvcId) =>
        this.#myInfoGovClient.getPerson(accessToken, attributes, eSrvcId),
      BREAKER_PARAMS,
    )
  }

  /**
   * Creates a redirect URL which the client should visit in order to
   * log in to MyInfo and prefill their data on a form.
   * @param config.formId ID of form to which user should log in
   * @param config.formEsrvcId SingPass e-service ID of form
   * @param config.requestedAttributes MyInfo attributes requested in form
   */
  createRedirectURL({
    formId,
    formEsrvcId,
    requestedAttributes,
    encodedQuery,
  }: IMyInfoRedirectURLArgs): Result<string, never> {
    const redirectURL = this.#myInfoGovClient.createRedirectURL({
      purpose: MYINFO_CONSENT_PAGE_PURPOSE,
      relayState: createRelayState(formId, encodedQuery),
      // Always request consent for NRIC/FIN
      requestedAttributes: internalAttrListToScopes(requestedAttributes),
      singpassEserviceId: formEsrvcId,
    })
    return ok(redirectURL)
  }

  /**
   * Parses state forwarded by MyInfo after user has logged in and MyInfo
   * has redirected them.
   * @param relayState State forwarded by MyInfo
   */
  parseMyInfoRelayState(
    relayState: string,
  ): Result<MyInfoRelayState, MyInfoParseRelayStateError> {
    const safeJSONParse = Result.fromThrowable(
      () => JSON.parse(relayState) as unknown,
      (error) => {
        logger.error({
          message: 'Error while calling JSON.parse on MyInfo relay state',
          meta: {
            action: 'parseMyInfoRelayState',
            relayState,
            error,
          },
        })
        return new MyInfoParseRelayStateError()
      },
    )
    return safeJSONParse().andThen((parsed) => {
      // Narrow type of parsed
      if (isMyInfoRelayState(parsed)) {
        return ok({
          uuid: parsed.uuid,
          formId: parsed.formId,
          encodedQuery: parsed.encodedQuery,
        })
      }
      logger.error({
        message: 'MyInfo relay state had invalid shape',
        meta: {
          action: 'parseMyInfoRelayState',
          relayState,
        },
      })
      return err(new MyInfoParseRelayStateError())
    })
  }

  /**
   * Retrieves an access token from MyInfo as part of OAuth2 flow.
   * @param authCode Authorisation code provided by MyInfo
   */
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
   * Prefill given current form fields with given MyInfo data.
   * Saves the hash of the prefilled fields as well because the two operations are atomic and should not be separated
   * @param formId
   * @param myInfoData
   * @param currFormFields
   * @returns currFormFields with the MyInfo fields prefilled with data from myInfoData
   */
  prefillAndSaveMyInfoFields(
    formId: string,
    myInfoData: MyInfoData,
    currFormFields: LeanDocument<IFieldSchema[]>,
  ): ResultAsync<PossiblyPrefilledField[], MyInfoHashingError | DatabaseError> {
    const prefilledFields = currFormFields.map((field) => {
      if (!field.myInfo?.attr) return field

      const myInfoAttr = field.myInfo.attr
      const { fieldValue, isReadOnly } =
        myInfoData.getFieldValueForAttr(myInfoAttr)
      const prefilledField = cloneDeep(field) as PossiblyPrefilledField
      prefilledField.fieldValue = fieldValue

      // Disable field
      prefilledField.disabled = isReadOnly
      return prefilledField
    })
    return this.saveMyInfoHashes(
      myInfoData.getUinFin(),
      formId,
      prefilledFields,
    ).map(() => prefilledFields)
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
    prefilledFormFields: PossiblyPrefilledField[],
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

  /**
   * Decodes and verifies FormSG's JWT containing the user's
   * UIN/FIN.
   * @param loginJwt Login JWT
   */
  verifyLoginJwt(
    loginJwt: string,
  ): Result<MyInfoLoginCookiePayload, MyInfoInvalidLoginCookieError> {
    return Result.fromThrowable(
      () => jwt.verify(loginJwt, spcpMyInfoConfig.myInfoJwtSecret),
      (error) => {
        logger.error({
          message: 'Error while verifying MyInfo login cookie',
          meta: {
            action: 'verifyLoginJwt',
          },
          error,
        })
        return new MyInfoInvalidLoginCookieError()
      },
    )().andThen((decoded) => {
      if (isMyInfoLoginCookie(decoded)) {
        return ok(decoded)
      }
      return err(new MyInfoInvalidLoginCookieError())
    })
  }

  /**
   * Gets myInfo data using the provided form and the MyInfo access token
   * @param form the form to validate
   * @param accessToken MyInfo access token
   * @returns ok(MyInfoData) if the form has been validated successfully
   * @returns err(FormAuthNoEsrvcIdError) if form has no eserviceId
   * @returns err(AuthTypeMismatchError) if the client was not authenticated using MyInfo
   * @returns err(MyInfoCircuitBreakerError) if circuit breaker was active
   * @returns err(MyInfoFetchError) if validated but the data could not be retrieved
   */
  getMyInfoDataForForm(
    form: IPopulatedForm,
    accessToken: string,
  ): ResultAsync<
    MyInfoData,
    | FormAuthNoEsrvcIdError
    | AuthTypeMismatchError
    | MyInfoCircuitBreakerError
    | MyInfoFetchError
  > {
    const requestedAttributes = form.getUniqueMyInfoAttrs()
    return validateMyInfoForm(form).asyncAndThen((form) =>
      ResultAsync.fromPromise(
        this.#myInfoPersonBreaker
          .fire(
            accessToken,
            internalAttrListToScopes(requestedAttributes),
            form.esrvcId,
          )
          .then((response) => new MyInfoData(response)),
        (error) => {
          const logMeta = {
            action: 'getMyInfoDataForForm',
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
      ),
    )
  }

  // TODO(#5452): Stop accepting old cookie
  extractUinFromOldAndNewLoginCookie(
    cookies: Record<string, unknown>,
  ): Result<
    string,
    MyInfoInvalidLoginCookieError | MyInfoMissingLoginCookieError
  > {
    // Look for new cookie first
    const newCookieResult = extractMyInfoLoginJwt(cookies)
      .andThen(this.verifyLoginJwt)
      .map((payload) => payload.uinFin)
    if (newCookieResult.isOk()) {
      logger.info({
        message: 'Decrypted new MyInfo cookie successfully',
        meta: {
          action: 'extractUinFromOldAndNewLoginCookie',
        },
      })
      return newCookieResult
    }

    // If new cookie not present, look for old cookie
    const oldCookieResult = extractAndAssertOldMyInfoCookieValidity(
      cookies,
    ).andThen((payload) =>
      Result.fromThrowable(
        () => this.#myInfoGovClient.extractUinFin(payload.accessToken),
        (error) => {
          logger.error({
            message: 'Error while extracting uinFin from MyInfo access token',
            meta: {
              action: 'extractUinFromOldAndNewLoginCookie',
            },
            error,
          })
          return new MyInfoInvalidLoginCookieError()
        },
      )(),
    )

    if (oldCookieResult.isOk()) {
      logger.info({
        message: 'Decrypted old MyInfo cookie successfully',
        meta: {
          action: 'extractUinFromOldAndNewLoginCookie',
        },
      })
      return oldCookieResult
    }

    // If both cookies are not present, return new cookie result so error
    // logging reflects absence of new cookie
    return newCookieResult
  }
}

export const MyInfoService = new MyInfoServiceClass({
  spcpMyInfoConfig,
  appUrl: config.app.appUrl,
  nodeEnv: config.nodeEnv,
})
