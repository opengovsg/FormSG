import {
  IPersonBasic,
  IPersonBasicRequest,
  Mode as MyInfoClientMode,
  MyInfoGovClient,
} from '@opengovsg/myinfo-gov-client'
import Bluebird from 'bluebird'
import fs from 'fs'
import { cloneDeep, keyBy, mapValues } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import CircuitBreaker from 'opossum'

import getMyInfoHashModel from 'src/app/models/myinfo_hash.server.model'
import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'

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

import {
  CircuitBreakerError,
  FetchMyInfoError,
  HashDidNotMatchError,
  HashingError,
  MissingHashError,
} from './myinfo.errors'
import { IPossiblyPrefilledField, VisibleMyInfoResponse } from './myinfo.types'
import {
  compareMyInfoHash,
  createHashPromises,
  getMyInfoValue,
  hasMyInfoAnswer,
  isFieldReadOnly,
} from './myinfo.util'

const logger = createLoggerWithLabel(module)
const MyInfoHash = getMyInfoHashModel(mongoose)

export class MyInfoService {
  #myInfoClientBreaker: CircuitBreaker<[IPersonBasicRequest], IPersonBasic>
  #spCookieMaxAge: number

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
    if (nodeEnv === Environment.Prod) {
      const myInfoPrefix =
        myInfoClientMode === MyInfoClientMode.Staging ? 'STG2-' : 'PROD2-'
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
        privateKey: fs.readFileSync(
          './node_modules/@opengovsg/mockpass/static/certs/key.pem',
        ),
        appId: 'STG2-' + singpassEserviceId,
        mode: MyInfoClientMode.Dev,
      })
      myInfoGovClient.baseUrl = 'http://localhost:5156/myinfo/v2/'
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
        const isCircuitOpen = CircuitBreaker.isOurError(error)
        const logMessage = isCircuitOpen
          ? 'Circuit breaker tripped'
          : 'Error retrieving from MyInfo'
        logger.error({
          message: logMessage,
          meta: {
            action: 'fetchMyInfoPersonData',
            meta: {
              requestedAttributes: params.requestedAttributes,
              eServiceId: params.singpassEserviceId,
            },
          },
          error,
        })
        return isCircuitOpen
          ? new CircuitBreakerError(logMessage)
          : new FetchMyInfoError(logMessage)
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
    return ok(
      currFormFields.map((field) => {
        if (!field?.myInfo?.attr) return field

        const myInfoAttr = field.myInfo.attr
        const myInfoValue = getMyInfoValue(myInfoAttr, myInfoData)
        const isReadOnly = isFieldReadOnly(myInfoAttr, myInfoValue, myInfoData)
        const prefilledField = cloneDeep(field) as IPossiblyPrefilledField
        prefilledField.fieldValue = myInfoValue

        // Disable field
        prefilledField.disabled = isReadOnly
        return prefilledField
      }),
    )
  }

  /**
   * Saves hashed prefilled values of MyInfo fields.
   * @param prefilledFormFields Fields with fieldValue prefilled and disabled set to true if read-only
   */
  saveMyInfoHashes(
    uinFin: string,
    formId: string,
    prefilledFormFields: IPossiblyPrefilledField[],
  ): ResultAsync<IMyInfoHashSchema | null, HashingError | DatabaseError> {
    const readOnlyHashPromises = createHashPromises(prefilledFormFields)
    return ResultAsync.fromPromise(
      Bluebird.props<IHashes>(readOnlyHashPromises),
      (error) => {
        const message = 'Failed to hash MyInfo values'
        logger.error({
          message,
          meta: {
            action: 'saveMyInfoHashes',
            myInfoAttributes: Object.keys(readOnlyHashPromises),
          },
          error,
        })
        return new HashingError(message)
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
      return errAsync(new MissingHashError('MyInfo hashes not found.'))
    })
  }

  doMyInfoHashesMatch(
    responses: ProcessedFieldResponse[],
    hashes: IHashes,
  ): ResultAsync<MyInfoAttribute[], HashingError | HashDidNotMatchError> {
    // Filter twice to get the types to cooperate
    const responsesWithHashes: VisibleMyInfoResponse[] = responses
      .filter(hasMyInfoAnswer)
      .filter((response) => !!hashes[response.myInfo.attr])
    // Map attribute to response
    const myInfoResponsesObj = keyBy(
      responsesWithHashes,
      (field) => field.myInfo.attr,
    )
    // Map attribute to Promise<boolean>
    const compareHashPromises = mapValues(myInfoResponsesObj, (answer) =>
      // Already checked that hashes contains this attr
      compareMyInfoHash(hashes[answer.myInfo.attr]!, answer),
    )
    return ResultAsync.fromPromise(
      Bluebird.props(compareHashPromises),
      (error) => {
        const message = 'Error while comparing MyInfo hashes'
        logger.error({
          message,
          meta: {
            action: 'doMyInfoHashesMatch',
          },
          error,
        })
        return new HashingError(message)
      },
    ).andThen((comparisonResults) => {
      const comparedAttrs = Object.keys(comparisonResults) as MyInfoAttribute[]
      // All outcomes should be true
      const failedAttrs = comparedAttrs.filter(
        (attr) => !comparisonResults[attr],
      )
      if (failedAttrs.length > 0) {
        const message = 'MyInfo Hash did not match'
        logger.error({
          message,
          meta: {
            action: 'doMyInfoHashesMatch',
            failedAttrs,
          },
        })
        return errAsync(new HashDidNotMatchError(message))
      }
      return okAsync(comparedAttrs)
    })
  }
}
