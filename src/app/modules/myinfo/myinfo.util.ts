import {
  CATEGORICAL_DATA_DICT,
  IPersonBasic,
  MyInfoSource,
} from '@opengovsg/myinfo-gov-client'
import bcrypt from 'bcrypt'
import { StatusCodes } from 'http-status-codes'
import { get } from 'lodash'
import moment from 'moment'

import { createLoggerWithLabel } from '../../../config/logger'
import { types as myInfoTypes } from '../../../shared/resources/myinfo'
import {
  BasicField,
  IHashes,
  IMyInfo,
  MapRouteError,
  MyInfoAttribute,
} from '../../../types'
import { DatabaseError, MissingFeatureError } from '../core/core.errors'
import { ProcessedFieldResponse } from '../submission/submission.types'

import {
  MyInfoHashDidNotMatchError,
  MyInfoHashingError,
  MyInfoMissingHashError,
} from './myinfo.errors'
import { formatAddress, formatPhoneNumber } from './myinfo.format'
import {
  IPossiblyPrefilledField,
  MyInfoComparePromises,
  MyInfoHashPromises,
  VisibleMyInfoResponse,
} from './myinfo.types'

const logger = createLoggerWithLabel(module)
const HASH_SALT_ROUNDS = 10

/**
 * Retrieves the full MyInfo field value. If field is categorical, the
 * returned value is retrieved from MyInfo data dictionary. Otherwise, it is
 * parsed accordingly to construct the returned string.
 * @param myInfoAttr The MyInfo attribute
 * @param myInfoData MyInfo person data object returned from MyInfoGovAuthClient
 * @return The full formatted values, if it exists, otherwise the myInfoKey is returned.
 */
export const getMyInfoValue = (
  myInfoAttr: MyInfoAttribute,
  myInfoData: IPersonBasic,
): string | undefined => {
  switch (myInfoAttr) {
    // Phone numbers
    case MyInfoAttribute.MobileNo:
      return formatPhoneNumber(myInfoData[myInfoAttr])
    case MyInfoAttribute.RegisteredAddress:
      return formatAddress(myInfoData[myInfoAttr])
    default:
      // Categorical data lookup
      if (CATEGORICAL_DATA_DICT[myInfoAttr]) {
        return get(
          CATEGORICAL_DATA_DICT,
          [myInfoAttr, myInfoData[myInfoAttr].value!, 'description'],
          '',
        )
      } else {
        return get(myInfoData[myInfoAttr], 'value', '')
      }
  }
}

/**
 * Determine if frontend should lock the field to prevent it from being
 * editable. The field is locked if it is government-verified and if it
 * does not contain marriage-related information (decision by SNDGO & MSF due to
 * overseas unregistered marriages). An empty myInfo field will always evaluate
 * to false so that the field can be filled by form-filler.
 *
 * The affected marriage fields are:
 * - marital
 * - marriagedate
 * - divorcedate
 * - countryofmarriage
 * - marriagecertno
 *
 * The function also uses the provided "source" flag within each MyInfo field to
 * determine whether data is government verified.
 *
 * The mapping for "source" field is:
 *
 * 1 - Government-verified Data
 * 2 - User Provided Data
 * 3 - Not Applicable (e.g. CPF data for foreigners)
 * 4 - Data retrieved from SingPass (e.g. email, mobileno)
 * @param myInfoAttr The MyInfo attribute
 * @param myInfoValue myInfoValue returned by getMyInfoValue
 * @param myInfoData MyInfo person data object returned from MyInfoGovAuthClient
 * @returns Whether the field is readonly.
 */
export const isFieldReadOnly = (
  myInfoAttr: MyInfoAttribute,
  myInfoValue: string | undefined,
  myInfoData: IPersonBasic,
): boolean => {
  if (!myInfoAttr || !myInfoValue || !myInfoData || !myInfoData[myInfoAttr]) {
    return false
  }
  return (
    !!myInfoValue &&
    myInfoData[myInfoAttr].source === MyInfoSource.GovtVerified &&
    ![
      MyInfoAttribute.Marital,
      MyInfoAttribute.MarriageDate,
      MyInfoAttribute.DivorceDate,
      MyInfoAttribute.CountryOfMarriage,
      MyInfoAttribute.MarriageCertNo,
    ].includes(myInfoAttr)
  )
}

/**
 * Hashes field values which are prefilled and MyInfo-verified.
 * @param prefilledFormFields Fields with fieldValue prefilled using MyInfo and disabled
 * set to true if the prefilled value is MyInfo-verified
 * @returns object mapping MyInfo attributes to Promises of their hashes
 */
export const hashFieldValues = (
  prefilledFormFields: IPossiblyPrefilledField[],
): MyInfoHashPromises => {
  const readOnlyHashPromises: MyInfoHashPromises = {}

  prefilledFormFields.forEach((field) => {
    if (!field.myInfo?.attr || !field.fieldValue || !field.disabled) return
    readOnlyHashPromises[field.myInfo.attr] = bcrypt.hash(
      field.fieldValue.toString(),
      HASH_SALT_ROUNDS,
    )
  })
  return readOnlyHashPromises
}

/**
 * Whether a field contains a MyInfo response
 * @param field a processed response with the isVisible attribute
 */
const hasMyInfoAnswer = (
  field: ProcessedFieldResponse,
): field is VisibleMyInfoResponse => {
  return !!field.isVisible && !!field.myInfo?.attr
}

const filterFieldsWithHashes = (
  responses: ProcessedFieldResponse[],
  hashes: IHashes,
): VisibleMyInfoResponse[] => {
  // Filter twice to get types to cooperate
  return responses
    .filter(hasMyInfoAnswer)
    .filter((response) => !!hashes[response.myInfo.attr])
}

const transformAnswer = (field: VisibleMyInfoResponse): string => {
  const answer = field.answer
  return field.fieldType === BasicField.Date
    ? moment(new Date(answer)).format('YYYY-MM-DD')
    : answer
}

const compareSingleHash = (
  hash: string,
  field: VisibleMyInfoResponse,
): Promise<boolean> => {
  const transformedAnswer = transformAnswer(field)
  return bcrypt.compare(transformedAnswer, hash)
}

/**
 * Compares the MyInfo responses within the given response array to the given hashes.
 * @param responses Responses with isVisible true if they are not hidden by logic
 * @param hashes Hashed values of the MyInfo responses
 */
export const compareHashedValues = (
  responses: ProcessedFieldResponse[],
  hashes: IHashes,
): MyInfoComparePromises => {
  // Filter responses to only those fields with a corresponding hash
  const fieldsWithHashes = filterFieldsWithHashes(responses, hashes)
  // Map MyInfoAttribute to response
  const myInfoResponsesMap: MyInfoComparePromises = new Map()
  fieldsWithHashes.forEach((field) => {
    const attr = field.myInfo.attr
    // Already checked that hashes contains this attr
    myInfoResponsesMap.set(field._id, compareSingleHash(hashes[attr]!, field))
  })
  return myInfoResponsesMap
}

/**
 * Maps an error to the status code and message returned for the verifyMyInfoVals middleware
 * @param error The error thrown
 */
export const mapVerifyMyInfoError: MapRouteError = (error) => {
  switch (error.constructor) {
    case MissingFeatureError:
    case MyInfoHashingError:
    case DatabaseError:
      return {
        statusCode: StatusCodes.SERVICE_UNAVAILABLE,
        errorMessage:
          'MyInfo verification unavailable, please try again later.',
      }
    case MyInfoMissingHashError:
      return {
        statusCode: StatusCodes.GONE,
        errorMessage:
          'MyInfo verification expired, please refresh and try again.',
      }
    case MyInfoHashDidNotMatchError:
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        errorMessage: 'MyInfo verification failed.',
      }
    default:
      logger.error({
        message: 'Unknown route error observed',
        meta: {
          action: 'mapVerifyMyInfoError',
        },
        error,
      })
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: 'Something went wrong. Please try again.',
      }
  }
}

export const getMyInfoFieldOptions = (
  myInfoAttr: IMyInfo['attr'],
): string[] => {
  const [myInfoField] = myInfoTypes.filter((type) => type.name === myInfoAttr)
  return myInfoField?.fieldOptions || []
}
