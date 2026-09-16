import Bluebird from 'bluebird'
import {
  MyInfoAttribute as InternalAttr,
  MyInfoChildData,
} from 'formsg-shared/types'
import jwt from 'jsonwebtoken'
import { cloneDeep } from 'lodash'
import mongoose, { FlattenMaps } from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import {
  IFieldSchema,
  IHashes,
  IMyInfoHashSchema,
  PossiblyPrefilledField,
} from '../../../types'
import { spcpMyInfoConfig } from '../../config/features/spcp-myinfo.config'
import { createLoggerWithLabel } from '../../config/logger'
import { DatabaseError } from '../core/core.errors'
import { SGIDMyInfoData } from '../sgid/sgid.adapter'
import { ProcessedFieldResponse } from '../submission/submission.types'

import { MyInfoData } from './myinfo.adapter'
import {
  MyInfoHashDidNotMatchError,
  MyInfoHashingError,
  MyInfoInvalidLoginCookieError,
  MyInfoMissingHashError,
} from './myinfo.errors'
import {
  IMyInfoServiceConfig,
  MyInfoKey,
  MyInfoLoginCookiePayload,
} from './myinfo.types'
import {
  compareHashedValues,
  getMyInfoAttr,
  getMyInfoAttributeConstantsList,
  hashFieldValues,
  isMyInfoChildrenBirthRecords,
  isMyInfoLoginCookie,
  logIfFieldValueNotInMyinfoList,
} from './myinfo.util'
import getMyInfoHashModel from './myinfo_hash.model'

const logger = createLoggerWithLabel(module)
const MyInfoHash = getMyInfoHashModel(mongoose)

/**
 * Class for managing MyInfo-related functionality.
 * Exported for testing.
 */
export class MyInfoServiceClass {
  /**
   * TTL of SingPass cookie in milliseconds.
   */
  #spCookieMaxAge: number

  /**
   * @param myInfoConfig Environment variables including spCookieMaxAge
   */
  constructor({ spcpMyInfoConfig }: IMyInfoServiceConfig) {
    this.#spCookieMaxAge = spcpMyInfoConfig.spCookieMaxAge
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
    myInfoData: MyInfoData | SGIDMyInfoData,
    currFormFields: FlattenMaps<IFieldSchema[]>,
  ): ResultAsync<PossiblyPrefilledField[], MyInfoHashingError | DatabaseError> {
    const allChildAttrs: InternalAttr[] = []
    const prefilledFields = currFormFields.map((field) => {
      const myInfoAttr = getMyInfoAttr(field)
      // Children field prefilling is handled by the frontend.
      if (isMyInfoChildrenBirthRecords(field.myInfo?.attr)) {
        // Compound field, explode subfields.
        allChildAttrs.push(...(myInfoAttr as InternalAttr[]))
        // This compound field is responsible for its own filling.
        return field as PossiblyPrefilledField
      }

      if (myInfoAttr === undefined) {
        return field as PossiblyPrefilledField
      }

      const { fieldValue, isReadOnly } = myInfoData.getFieldValueForAttr(
        myInfoAttr as InternalAttr,
      )

      // Check if field value exists in our constants lists. If it doesn't, log the error
      if (fieldValue) {
        const myInfoConstantsList = getMyInfoAttributeConstantsList(myInfoAttr)
        if (myInfoConstantsList) {
          logIfFieldValueNotInMyinfoList(
            fieldValue,
            myInfoAttr,
            myInfoConstantsList,
            myInfoData,
          )
        }
      }

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
      myInfoData instanceof MyInfoData
        ? myInfoData.getChildrenBirthRecords(allChildAttrs)
        : undefined,
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
    childrenBirthRecords?: MyInfoChildData,
  ): ResultAsync<IMyInfoHashSchema | null, MyInfoHashingError | DatabaseError> {
    const readOnlyHashPromises = hashFieldValues(
      prefilledFormFields,
      childrenBirthRecords,
    )
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
  ): ResultAsync<
    Set<MyInfoKey>,
    MyInfoHashingError | MyInfoHashDidNotMatchError
  > {
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
}

export const MyInfoService = new MyInfoServiceClass({
  spcpMyInfoConfig,
})
