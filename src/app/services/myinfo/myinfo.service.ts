import {
  IPersonBasic,
  IPersonBasicRequest,
  Mode as MyInfoClientMode,
  MyInfoGovClient,
} from '@opengovsg/myinfo-gov-client'
import Bluebird from 'bluebird'
import fs from 'fs'
import { cloneDeep } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import CircuitBreaker from 'opossum'

import { IMyInfoConfig } from '../../../config/feature-manager'
import { createLoggerWithLabel } from '../../../config/logger'
import {
  Environment,
  IFieldSchema,
  IHashes,
  IMyInfoHashSchema,
  MyInfoAttribute,
} from '../../../types'
import { DatabaseError } from '../../modules/core/core.errors'
import { ProcessedFieldResponse } from '../../modules/submission/submission.types'

import {
  CircuitBreakerError,
  FetchMyInfoError,
  HashDidNotMatchError,
  HashingError,
  MissingHashError,
} from './myinfo.errors'
import { IPossiblyPrefilledField } from './myinfo.types'
import {
  compareHashedValues,
  getMyInfoValue,
  hashFieldValues,
  isFieldReadOnly,
} from './myinfo.util'
import getMyInfoHashModel from './myinfo_hash.model'

const logger = createLoggerWithLabel(module)
const MyInfoHash = getMyInfoHashModel(mongoose)

const MYINFO_STG_PREFIX = 'STG2-'
const MYINFO_PROD_PREFIX = 'PROD2-'
const MYINFO_DEV_BASE_URL = 'http://localhost:5156/myinfo/v2/'

export class MyInfoService {
  /**
   * Circuit breaker which fires requests to the MyInfo PersonBasic endpoint
   * and limits the rate of requests in case the receiving server returns errors.
   */
  #myInfoClientBreaker: CircuitBreaker<[IPersonBasicRequest], IPersonBasic>
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
  constructor({
    myInfoConfig,
    nodeEnv,
    realm,
    singpassEserviceId,
    spCookieMaxAge,
  }: {
    myInfoConfig: IMyInfoConfig
    nodeEnv: Environment
    realm: string
    singpassEserviceId: string
    spCookieMaxAge: number
  }) {
    this.#spCookieMaxAge = spCookieMaxAge

    const { myInfoClientMode, myInfoKeyPath } = myInfoConfig
    let myInfoGovClient: MyInfoGovClient
    const myInfoPrefix =
      myInfoClientMode === MyInfoClientMode.Staging
        ? MYINFO_STG_PREFIX
        : MYINFO_PROD_PREFIX
    if (nodeEnv === Environment.Prod) {
      myInfoGovClient = new MyInfoGovClient({
        realm,
        singpassEserviceId,
        privateKey: fs.readFileSync(myInfoKeyPath),
        appId: myInfoPrefix + singpassEserviceId,
        mode: myInfoClientMode,
      })
    } else {
      myInfoGovClient = new MyInfoGovClient({
        realm,
        singpassEserviceId,
        privateKey: fs.readFileSync(myInfoKeyPath),
        appId: myInfoPrefix + singpassEserviceId,
        mode: MyInfoClientMode.Dev,
      })
      myInfoGovClient.baseUrl = MYINFO_DEV_BASE_URL
    }

    this.#myInfoClientBreaker = new CircuitBreaker(
      (params) => myInfoGovClient.getPersonBasic(params),
      {
        errorThresholdPercentage: 80, // % of errors before breaker trips
        timeout: 5000, // max time before individual request fails, ms
        rollingCountTimeout: 30000, // width of statistical window, ms
        volumeThreshold: 5, // min number of requests within statistical window before breaker trips
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
    params: IPersonBasicRequest,
  ): ResultAsync<IPersonBasic, CircuitBreakerError | FetchMyInfoError> {
    return ResultAsync.fromPromise(
      this.#myInfoClientBreaker.fire(params),
      (error) => {
        const logMeta = {
          action: 'fetchMyInfoPersonData',
          requestedAttributes: params.requestedAttributes,
          eServiceId: params.singpassEserviceId,
        }
        if (CircuitBreaker.isOurError(error)) {
          logger.error({
            message: 'Circuit breaker tripped',
            meta: logMeta,
            error,
          })
          return new CircuitBreakerError()
        } else {
          logger.error({
            message: 'Error retrieving data from MyInfo',
            meta: logMeta,
            error,
          })
          return new FetchMyInfoError()
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
    myInfoData: IPersonBasic,
    currFormFields: IFieldSchema[],
  ): Result<IPossiblyPrefilledField[], never> {
    const prefilledFields = currFormFields.map((field) => {
      if (!field?.myInfo?.attr) return field

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
  ): ResultAsync<IMyInfoHashSchema | null, HashingError | DatabaseError> {
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
        return new HashingError()
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
  ): ResultAsync<IHashes, DatabaseError | MissingHashError> {
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
      return errAsync(new MissingHashError())
    })
  }

  /**
   * Checks that the given responses match the given hashes.
   * @param responses Fields processed with the isVisible attribute
   * @param hashes MyInfo value hashes retrieved from the database
   * @returns the set of MyInfo attributes which were verified using their hashes
   * @throws if an error occurred while comparing the responses and their hashes, or if any
   * hash did not match the submitted value
   */
  checkMyInfoHashes(
    responses: ProcessedFieldResponse[],
    hashes: IHashes,
  ): ResultAsync<Set<MyInfoAttribute>, HashingError | HashDidNotMatchError> {
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
        return new HashingError()
      },
    ).andThen((comparisonResults) => {
      const comparedAttrs = Array.from(comparisonResults.keys())
      // All outcomes should be true
      const failedAttrs = comparedAttrs.filter(
        (attr) => !comparisonResults.get(attr),
      )
      if (failedAttrs.length > 0) {
        logger.error({
          message: 'MyInfo Hash did not match',
          meta: {
            action: 'checkMyInfoHashes',
            failedAttrs,
          },
        })
        return errAsync(new HashDidNotMatchError())
      }
      return okAsync(new Set(comparedAttrs))
    })
  }
}
