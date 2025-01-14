import bcrypt from 'bcrypt'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import mongoose, { LeanDocument } from 'mongoose'
import { err, ok, Result } from 'neverthrow'
import { v4 as uuidv4, validate as validateUUID } from 'uuid'

import {
  myInfoCountries,
  myInfoDialects,
  myInfoHdbTypes,
  myInfoHousingTypes,
  myInfoNationalities,
  myInfoOccupations,
  myInfoRaces,
  types as myInfoTypes,
} from '../../../../shared/constants/field/myinfo'
import {
  BasicField,
  ChildrenCompoundFieldBase,
  FormAuthType,
  MyInfoAttribute as InternalAttr,
  MyInfoAttribute,
  MyInfoChildAttributes,
  MyInfoChildData,
  MyInfoChildVaxxStatus,
} from '../../../../shared/types'
import { formatMyinfoDate } from '../../../../shared/utils/dates'
import { hasProp } from '../../../../shared/utils/has-prop'
import {
  IFieldSchema,
  IFormSchema,
  IHashes,
  IMyInfo,
  MapRouteError,
  PossiblyPrefilledField,
} from '../../../types'
import { spcpMyInfoConfig } from '../../config/features/spcp-myinfo.config'
import { createLoggerWithLabel } from '../../config/logger'
import { DatabaseError } from '../core/core.errors'
import {
  AuthTypeMismatchError,
  FormAuthNoEsrvcIdError,
  FormNotFoundError,
} from '../form/form.errors'
import { SGIDMyInfoData } from '../sgid/sgid.adapter'
import { SGID_MYINFO_LOGIN_COOKIE_NAME } from '../sgid/sgid.constants'
import {
  ProcessedChildrenResponse,
  ProcessedFieldResponse,
} from '../submission/submission.types'

import { MyInfoData } from './myinfo.adapter'
import { MYINFO_LOGIN_COOKIE_NAME } from './myinfo.constants'
import {
  MyInfoCookieStateError,
  MyInfoHashDidNotMatchError,
  MyInfoHashingError,
  MyInfoInvalidAuthCodeCookieError,
  MyInfoMissingHashError,
  MyInfoMissingLoginCookieError,
} from './myinfo.errors'
import {
  MyInfoAuthCodeCookiePayload,
  MyInfoAuthCodeCookieState,
  MyInfoChildKey,
  MyInfoComparePromises,
  MyInfoForm,
  MyInfoHashPromises,
  MyInfoLoginCookiePayload,
  MyInfoRelayState,
  VisibleMyInfoResponse,
} from './myinfo.types'

const logger = createLoggerWithLabel(module)
const HASH_SALT_ROUNDS = 1

/**
 * See hashFieldValues for usage.
 *
 * @param field
 * @param childrenBirthRecords
 * @param readOnlyHashPromises
 */
function hashChildrenFieldValues(
  field: PossiblyPrefilledField,
  childrenBirthRecords: MyInfoChildData,
  readOnlyHashPromises: MyInfoHashPromises,
) {
  const subFields = getMyInfoAttr(field) as MyInfoChildAttributes[]
  subFields.forEach((subField) => {
    const fieldArr = childrenBirthRecords[subField]
    let myInfoFormattedValue: string
    fieldArr?.forEach((value, childIdx) => {
      myInfoFormattedValue = value
      const childName =
        childrenBirthRecords?.[MyInfoChildAttributes.ChildName]?.[childIdx]
      if (childName === undefined) {
        return
      }
      // Skip all unknown vaccination statuses, let the user fill it in themselves.
      if (
        subField === MyInfoChildAttributes.ChildVaxxStatus &&
        value === MyInfoChildVaxxStatus.Unknown
      ) {
        return
      }
      if (!value) {
        return
      }
      // Child's DOB is processed different from non-child Myinfo dates
      // We have to return value in the the same date format as the frontend
      // Hence we format it here
      if (subField === MyInfoChildAttributes.ChildDateOfBirth) {
        myInfoFormattedValue = formatMyinfoDate(value)
      }
      readOnlyHashPromises[
        getMyInfoChildHashKey(field._id, subField, childIdx, childName)
      ] = bcrypt.hash(myInfoFormattedValue, HASH_SALT_ROUNDS)
    })
  })
}

/**
 * Hashes field values which are prefilled and MyInfo-verified.
 * @param prefilledFormFields Fields with fieldValue prefilled using MyInfo and disabled
 * set to true if the prefilled value is MyInfo-verified
 * @returns object mapping MyInfo attributes to Promises of their hashes
 */
export const hashFieldValues = (
  prefilledFormFields: PossiblyPrefilledField[],
  childrenBirthRecords?: MyInfoChildData,
): MyInfoHashPromises => {
  const readOnlyHashPromises: MyInfoHashPromises = {}

  prefilledFormFields.forEach((field) => {
    // For children fields, we need to explode their subfields.
    if (
      isMyInfoChildrenBirthRecords(field.myInfo?.attr) &&
      childrenBirthRecords !== undefined
    ) {
      hashChildrenFieldValues(field, childrenBirthRecords, readOnlyHashPromises)
      return
    }
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
  // Map MyInfoAttribute to response
  const myInfoResponsesMap: MyInfoComparePromises = new Map()
  responses.forEach((field) => {
    if (hasMyInfoAnswer(field)) {
      // Children birth records have multiple possible hash values so they
      // need to be checked one by one.
      if (field.myInfo.attr === MyInfoAttribute.ChildrenBirthRecords) {
        handleMyInfoChildHashResponse(field, hashes, myInfoResponsesMap)
        return
      }
      const hash = hashes[field.myInfo.attr]
      if (hash) {
        myInfoResponsesMap.set(field._id, compareSingleHash(hash, field))
      }
    }
  })
  return myInfoResponsesMap
}

/**
 * Maps an error to the status code and message returned for the verifyMyInfoVals middleware
 * @param error The error thrown
 */
export const mapVerifyMyInfoError: MapRouteError = (error) => {
  switch (error.constructor) {
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

/**
 * Maps errors while creating MyInfo redirect URL to status codes and messages.
 * @param error Error to be mapped
 * @param coreErrorMessage Default error message
 */
export const mapRedirectURLError: MapRouteError = (
  error,
  coreErrorMessage = 'Something went wrong. Please refresh and try again.',
) => {
  switch (error.constructor) {
    case FormNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage:
          'Could not find the form requested. Please refresh and try again.',
      }
    case AuthTypeMismatchError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'This form does not have MyInfo enabled. Please refresh and try again.',
      }
    case DatabaseError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: coreErrorMessage,
      }
    default:
      logger.error({
        message: 'Unknown route error observed',
        meta: {
          action: 'mapRedirectURLError',
        },
        error,
      })
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: coreErrorMessage,
      }
  }
}

/**
 * Retrieves the field options which should be provided with a MyInfo
 * dropdown field.
 * @param myInfoAttr MyInfo attribute
 */
export const getMyInfoFieldOptions = (
  myInfoAttr: IMyInfo['attr'],
): string[] => {
  const [myInfoField] = myInfoTypes.filter((type) => type.name === myInfoAttr)
  return myInfoField?.fieldOptions || []
}

/**
 * Creates state which MyInfo should forward back once user has logged in.
 * @param formId ID of form which user is logging into
 */
export const createRelayState = (
  formId: string,
  encodedQuery?: string,
): string =>
  JSON.stringify({
    uuid: uuidv4(),
    formId,
    encodedQuery,
  })

/**
 * Validates that a form is a MyInfo form with an e-service ID
 * @param form Form to validate
 */
export const validateMyInfoForm = <T extends IFormSchema>(
  form: T,
): Result<MyInfoForm<T>, FormAuthNoEsrvcIdError | AuthTypeMismatchError> => {
  if (!form.esrvcId) {
    return err(new FormAuthNoEsrvcIdError(form._id))
  }
  if (isMyInfoFormWithEsrvcId(form)) {
    return ok(form)
  }
  return err(new AuthTypeMismatchError(FormAuthType.MyInfo, form.authType))
}

// Typeguard to ensure that form has eserviceId and MyInfo authType
const isMyInfoFormWithEsrvcId = <F extends IFormSchema>(
  form: F,
): form is MyInfoForm<F> => {
  return form.authType === FormAuthType.MyInfo && !!form.esrvcId
}

/**
 * Type guard for MyInfo login cookie.
 * @param cookie Unknown object
 */
export const isMyInfoLoginCookie = (
  cookie: unknown,
): cookie is MyInfoLoginCookiePayload => {
  return (
    !!cookie &&
    typeof cookie === 'object' &&
    hasProp(cookie, 'uinFin') &&
    typeof cookie.uinFin === 'string'
  )
}

/**
 * Type guard for MyInfo auth code cookie.
 * @param cookie Unknown object
 */
export const isMyInfoAuthCodeCookie = (
  cookie: unknown,
): cookie is MyInfoAuthCodeCookiePayload => {
  if (
    cookie &&
    typeof cookie === 'object' &&
    hasProp(cookie, 'state') &&
    typeof cookie.state === 'string'
  ) {
    // Test for success state
    if (
      cookie.state === MyInfoAuthCodeCookieState.Success &&
      hasProp(cookie, 'authCode') &&
      typeof cookie.authCode === 'string' &&
      cookie.authCode.length
    ) {
      return true
    } else if (
      // Test for any other valid state
      Object.values<string>(MyInfoAuthCodeCookieState).includes(cookie.state)
    ) {
      return true
    }
  }
  return false
}

/**
 * Extracts a MyInfo login cookie from a request's cookies
 * @param cookies Cookies in a request
 */
export const extractMyInfoLoginJwt = (
  cookies: Record<string, unknown>,
  authType: FormAuthType.MyInfo | FormAuthType.SGID_MyInfo,
): Result<string, MyInfoMissingLoginCookieError> => {
  const jwt =
    cookies[
      authType === FormAuthType.MyInfo
        ? MYINFO_LOGIN_COOKIE_NAME
        : SGID_MYINFO_LOGIN_COOKIE_NAME
    ]
  if (typeof jwt === 'string' && !!jwt) {
    return ok(jwt)
  }
  return err(new MyInfoMissingLoginCookieError())
}

/**
 * Extracts a MyInfo auth code cookie from a request's cookies, and validates
 * its shape.
 * @param cookies Cookies in a request
 */
export const extractAuthCode = (
  cookie: unknown,
): Result<
  string,
  MyInfoInvalidAuthCodeCookieError | MyInfoCookieStateError
> => {
  if (!isMyInfoAuthCodeCookie(cookie)) {
    return err(new MyInfoInvalidAuthCodeCookieError(cookie))
  }
  if (cookie.state !== MyInfoAuthCodeCookieState.Success) {
    return err(new MyInfoCookieStateError())
  }
  return ok(cookie.authCode)
}

/**
 * Creates a MyInfo login cookie signed by FormSG
 * @param uinFin UIN/FIN to be signed
 * @returns JWT signed by FormSG
 */
export const createMyInfoLoginCookie = (uinFin: string): string => {
  const payload: MyInfoLoginCookiePayload = {
    uinFin,
  }
  return jwt.sign(payload, spcpMyInfoConfig.myInfoJwtSecret, {
    // this arg must be supplied in seconds
    expiresIn: spcpMyInfoConfig.spCookieMaxAge / 1000,
  })
}

export const isMyInfoRelayState = (obj: unknown): obj is MyInfoRelayState =>
  typeof obj === 'object' &&
  !!obj &&
  hasProp(obj, 'formId') &&
  typeof obj.formId === 'string' &&
  mongoose.Types.ObjectId.isValid(obj.formId) &&
  hasProp(obj, 'uuid') &&
  typeof obj.uuid === 'string' &&
  validateUUID(obj.uuid) &&
  ((hasProp(obj, 'encodedQuery') && typeof obj.encodedQuery === 'string') ||
    !hasProp(obj, 'encodedQuery'))

const MyInfoChildAttributeSet = new Set(Object.values(MyInfoChildAttributes))

export const isMyInfoChildrenBirthRecords = (
  attr: InternalAttr | undefined,
): boolean => {
  return (
    attr === InternalAttr.ChildrenBirthRecords ||
    MyInfoChildAttributeSet.has(attr as unknown as MyInfoChildAttributes)
  )
}

/**
 * Helper to access a MyInfo attribute from a field.
 *
 * This helps to explode compound fields as well into its constituent subfields.
 * @param field The field we want to access.
 * @returns Either the MyInfoAttribute, or an array of MyInfoAttribute, or not found.
 */
export const getMyInfoAttr = (
  field: IFieldSchema | LeanDocument<IFieldSchema>,
): string | string[] | undefined => {
  // Need to explode compound field.
  if (field.myInfo?.attr === MyInfoAttribute.ChildrenBirthRecords) {
    return (
      (field as ChildrenCompoundFieldBase).childrenSubFields ?? ([] as string[])
    )
  }
  return field.myInfo?.attr
}

/**
 * Helper function to get a MyInfo child's hash key inside an IHashes.
 *
 * @param fieldId The ID of the field the Child response belongs to.
 * @returns An IHashes-compatible key.
 */
export const getMyInfoChildHashKey = (
  fieldId: string,
  childAttr: MyInfoChildAttributes,
  childIdx: number,
  childName: string,
): MyInfoChildKey => {
  return `${MyInfoAttribute.ChildrenBirthRecords}.${fieldId}.${childAttr}.${childIdx}.${childName}`
}

/**
 * This function is responsible for checking the validity of hashes of
 * MyInfo Child fields.
 *
 * NOTE: if the hashes comparison fail, it assumes that it's a manually user
 * inputted child. As such, it will just not indicate in the response
 * that it is MyInfo verified.
 * @param field the processed response
 * @param hashes a map containing all the attributes mapped to hashes
 * @param myInfoResponsesMap the response to give to the user
 */
export const handleMyInfoChildHashResponse = (
  field: ProcessedFieldResponse,
  hashes: IHashes,
  myInfoResponsesMap: MyInfoComparePromises,
) => {
  const childField = field as ProcessedChildrenResponse
  const subFields = childField.childSubFieldsArray
  if (!subFields) {
    return
  }
  childField.answerArray.forEach((childAnswer, childIndex) => {
    // Name should be first field for child answers
    const childName = childAnswer[0]
    // Validate each answer (child)
    childAnswer.forEach((attrAnswer, subFieldIndex) => {
      const key = getMyInfoChildHashKey(
        field._id,
        subFields[subFieldIndex],
        childIndex,
        childName,
      )
      const hash = hashes[key]
      // Intentional, to allow user-filled fields to pass through.
      if (hash) {
        myInfoResponsesMap.set(key, bcrypt.compare(attrAnswer, hash))
      }
    })
  })
  return
}

/**
 * This function is responsible for mapping a myInfo attribute to
 * an existing myInfo constants list
 *
 * @param myInfoAttr the myInfo attribute
 */
export const getMyInfoAttributeConstantsList = (
  myInfoAttr: string | string[],
): string[] | undefined => {
  switch (myInfoAttr) {
    case MyInfoAttribute.Occupation:
      return myInfoOccupations
    case MyInfoAttribute.Race:
    case MyInfoAttribute.ChildRace:
    case MyInfoAttribute.ChildSecondaryRace:
      return myInfoRaces
    case MyInfoAttribute.Nationality:
      return myInfoNationalities
    case MyInfoAttribute.Dialect:
      return myInfoDialects
    case MyInfoAttribute.BirthCountry:
      return myInfoCountries
    case MyInfoAttribute.HousingType:
      return myInfoHousingTypes
    case MyInfoAttribute.HdbType:
      return myInfoHdbTypes
    default:
      return
  }
}

/**
 * Add logging to check if myInfo field value exists in a myInfo constants list
 * @param fieldValue
 * @param myInfoAttr
 * @param myInfoList
 */

export const logIfFieldValueNotInMyinfoList = (
  fieldValue: string,
  myInfoAttr: string | string[],
  myInfoList: string[],
  myInfoData: MyInfoData | SGIDMyInfoData,
) => {
  const isFieldValueInMyinfoList = myInfoList.includes(fieldValue)
  const myInfoSource =
    myInfoData instanceof MyInfoData ? 'Singpass MyInfo' : 'SGID MyInfo'

  if (isFieldValueInMyinfoList) return

  if (myInfoSource === 'Singpass MyInfo') {
    logger.error({
      message: 'Myinfo field value not found in existing Myinfo constants list',
      meta: {
        action: 'prefillAndSaveMyInfoFields',
        myInfoFieldValue: fieldValue,
        myInfoAttr,
        myInfoSource,
      },
    })
  } else if (
    // SGID returns NA instead of empty field values, we don't need this to be logged
    // as this is expected behaviour
    myInfoSource === 'SGID MyInfo' &&
    fieldValue !== 'NA'
  ) {
    logger.error({
      message: 'Myinfo field value not found in existing Myinfo constants list',
      meta: {
        action: 'prefillAndSaveMyInfoFields',
        myInfoFieldValue: fieldValue,
        myInfoAttr,
        myInfoSource,
      },
    })
  }
}
