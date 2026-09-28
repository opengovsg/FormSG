import bcrypt from 'bcrypt'
import {
  myInfoCountries,
  myInfoDialects,
  myInfoHdbTypes,
  myInfoHousingTypes,
  myInfoNationalities,
  myInfoOccupations,
  myInfoRaces,
  types as myInfoTypes,
} from 'formsg-shared/constants/field/myinfo'
import {
  BasicField,
  ChildrenCompoundFieldBase,
  FormAuthType,
  FormResponseMode,
  MyInfoAttribute as InternalAttr,
  MyInfoAttribute,
  MyInfoChildAttributes,
  MyInfoChildData,
  MyInfoChildVaxxStatus,
} from 'formsg-shared/types'
import { formatMyinfoDate } from 'formsg-shared/utils/dates'
import { hasProp } from 'formsg-shared/utils/has-prop'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import { FlattenMaps } from 'mongoose'
import { err, ok, Result } from 'neverthrow'

import {
  IFieldSchema,
  IHashes,
  IMyInfo,
  MapRouteError,
  PossiblyPrefilledField,
} from '../../../types'
import { spcpMyInfoConfig } from '../../config/features/spcp-myinfo.config'
import { createLoggerWithLabel } from '../../config/logger'
import { DatabaseError } from '../core/core.errors'
import { SGIDMyInfoData } from '../sgid/sgid.adapter'
import { SGID_MYINFO_LOGIN_COOKIE_NAME } from '../sgid/sgid.constants'
import {
  ProcessedChildrenResponse,
  ProcessedFieldResponse,
} from '../submission/submission.types'

import { MyInfoData } from './myinfo.adapter'
import { MYINFO_LOGIN_COOKIE_NAME } from './myinfo.constants'
import {
  MyInfoHashDidNotMatchError,
  MyInfoHashingError,
  MyInfoMissingHashError,
  MyInfoMissingLoginCookieError,
} from './myinfo.errors'
import {
  MyInfoChildKey,
  MyInfoComparePromises,
  MyInfoHashPromises,
  MyInfoLoginCookiePayload,
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

const MyInfoChildAttributeSet = new Set(Object.values(MyInfoChildAttributes))

/**
 * Whether a form may fetch sponsored children alongside birth records.
 * Requires the mrf-children feature flag, and only Multirespondent
 * forms qualify: they submit v4 responses, which record a per-child `type`
 * (local or sponsored). v1 responses have no such slot, so keeping them
 * local-only lets a later v1-to-v4 migration assume `local`.
 * @param isMrfChildrenEnabled whether the mrf-children flag is on; callers
 * pass false when the flag state is unknown so the fetch fails closed
 */
export const shouldFetchSponsoredChildren = (
  form: { responseMode: FormResponseMode },
  isMrfChildrenEnabled: boolean,
): boolean =>
  isMrfChildrenEnabled && form.responseMode === FormResponseMode.Multirespondent

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
  field: IFieldSchema | FlattenMaps<IFieldSchema>,
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
 * Finds the prefill hashes for every MyInfo child sharing the submitted name,
 * grouped by the child's index in the MyInfo data and keyed by sub-field. The
 * submitted child's position is unrelated to that index, so matching by name
 * is what lets any MyInfo child verify. Grouping by record is what stops a
 * submission from mixing sub-field values across two same-named children.
 */
const findMyInfoChildHashesByRecord = (
  hashes: IHashes,
  fieldId: string,
  childName: string,
): Map<number, Partial<Record<MyInfoChildAttributes, string>>> => {
  const prefix = `${MyInfoAttribute.ChildrenBirthRecords}.${fieldId}.`
  const byRecord = new Map<
    number,
    Partial<Record<MyInfoChildAttributes, string>>
  >()
  for (const [key, hash] of Object.entries(hashes)) {
    if (!hash || !key.startsWith(prefix)) continue
    // Remainder is `<childAttr>.<childIdx>.<childName>`; the name may contain dots.
    const rest = key.slice(prefix.length)
    const firstDot = rest.indexOf('.')
    const secondDot = rest.indexOf('.', firstDot + 1)
    if (firstDot < 0 || secondDot < 0) continue
    if (rest.slice(secondDot + 1) !== childName) continue
    const childAttr = rest.slice(0, firstDot) as MyInfoChildAttributes
    const childIdx = Number(rest.slice(firstDot + 1, secondDot))
    if (!Number.isInteger(childIdx)) continue
    const record = byRecord.get(childIdx) ?? {}
    record[childAttr] = hash
    byRecord.set(childIdx, record)
  }
  return byRecord
}

/**
 * This function is responsible for checking the validity of hashes of
 * MyInfo Child fields. Hashes are looked up by child name, and the result is
 * recorded under the submitted child's positional key, which downstream
 * consumers match on.
 *
 * When several MyInfo children share the submitted name, every sub-field is
 * judged against the single record that matches the most sub-fields, so a
 * submission cannot pass by combining values from two different children.
 *
 * NOTE: if no hash exists for a submitted child, it assumes that it's a
 * manually user inputted child. As such, it will just not indicate in the
 * response that it is MyInfo verified.
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
    const candidates = findMyInfoChildHashesByRecord(
      hashes,
      field._id,
      childName,
    )
    // Intentional, to allow user-filled fields to pass through.
    if (candidates.size === 0) return

    // Compare every submitted sub-field against every same-named record, then
    // keep the record with the most matches (lowest index on a tie).
    const bestRecord = Promise.all(
      [...candidates.entries()].map(async ([childIdx, record]) => {
        const matches = await Promise.all(
          childAnswer.map((attrAnswer, subFieldIndex) => {
            const hash = record[subFields[subFieldIndex]]
            return hash ? bcrypt.compare(attrAnswer, hash) : undefined
          }),
        )
        return { childIdx, matches }
      }),
    ).then((evaluated) =>
      evaluated.reduce((best, current) => {
        const score = (m: (boolean | undefined)[]) => m.filter(Boolean).length
        return score(current.matches) > score(best.matches) ? current : best
      }),
    )

    childAnswer.forEach((_attrAnswer, subFieldIndex) => {
      const subField = subFields[subFieldIndex]
      const hasHash = [...candidates.values()].some((r) => r[subField])
      if (!hasHash) return
      const key = getMyInfoChildHashKey(
        field._id,
        subField,
        childIndex,
        childName,
      )
      myInfoResponsesMap.set(
        key,
        bestRecord.then(({ matches }) => matches[subFieldIndex] ?? false),
      )
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
