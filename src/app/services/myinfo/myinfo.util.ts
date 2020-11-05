import {
  CATEGORICAL_DATA_DICT,
  IMyInfoAddr,
  IMyInfoPhoneNo,
  IPersonBasic,
  MyInfoSource,
} from '@opengovsg/myinfo-gov-client'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { get } from 'lodash'
import mongoose from 'mongoose'

import { sessionSecret } from '../../../config/config'
import {
  IFieldSchema,
  IHashes,
  IMyInfoHashSchema,
  MyInfoAttribute,
} from '../../../types'
import getMyInfoHashModel from '../../models/myinfo_hash.server.model'

import { IPossiblyPrefilledField, MyInfoHashPromises } from './myinfo.types'

const HASH_SALT_ROUNDS = 10
const MyInfoHash = getMyInfoHashModel(mongoose)

/**
 * Formats MyInfo attribute as phone number
 * @param phone
 * @example +65 98654321
 * @returns Phone number if phone.nbr exists. Else return empty string.
 */
const formatPhoneNumber = (phone: IMyInfoPhoneNo): string => {
  if (!phone || !phone.nbr) return ''

  return phone.prefix && phone.code && phone.nbr
    ? `${phone.prefix}${phone.code} ${phone.nbr}`
    : phone.nbr
}

/**
 * Formats MyInfo attribute as address
 * @param addr The address to format.
 * @example '411 CHUA CHU KANG AVE 3, #12-3, SINGAPORE 238823'
 * @returns Formatted address if minimally the `block`, `street`, `country`,and `postal` values are not empty in {@link addr}. Else return empty string.
 */
const formatAddress = (addr: IMyInfoAddr): string => {
  // Early return if missing required props in address.
  if (!addr || !(addr.block && addr.street && addr.country && addr.postal)) {
    return ''
  }

  const { building, block, street, floor, unit, country, postal } = addr

  // Create an array of data in the order:
  // 1. building (if available),
  // 2. block,
  // 3. street,
  // 4. floor + unit (if available),
  // 5. country
  // 6. postal
  const buildingBlocks = []

  if (building) {
    buildingBlocks.push(`${building},`)
  }
  buildingBlocks.push(block)
  buildingBlocks.push(`${street},`)

  if (floor && unit) {
    buildingBlocks.push(`#${floor}-${unit},`)
  }

  buildingBlocks.push(
    get(
      CATEGORICAL_DATA_DICT,
      ['birthcountry', country, 'description'],
      // Return country as default value if it is not in the dictionary.
      country,
    ),
  )

  buildingBlocks.push(postal)

  // Return string form with each block being separated by a space.
  return buildingBlocks.join(' ')
}

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
    case MyInfoAttribute.HomeNo:
      return formatPhoneNumber(myInfoData[myInfoAttr])
    case MyInfoAttribute.RegisteredAddress:
    case MyInfoAttribute.BillingAddress:
    case MyInfoAttribute.MailingAddress:
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

export const createHashPromises = (
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

export const saveHashesToDatabase = (
  readOnlyHashes: IHashes,
  uinFin: string,
  formId: string,
  cookieAge: number,
): Promise<IMyInfoHashSchema | null> => {
  const hashedUinFin = crypto
    .createHmac('sha256', sessionSecret)
    .update(uinFin)
    .digest('hex')
  return MyInfoHash.updateHashes(
    hashedUinFin,
    formId,
    readOnlyHashes,
    cookieAge,
  )
}

export const extractRequestedAttributes = (
  formFields: IFieldSchema[],
): MyInfoAttribute[] => {
  const attrs: MyInfoAttribute[] = []
  formFields.forEach((field) => {
    if (field.myInfo?.attr) {
      attrs.push(field.myInfo.attr)
    }
  })
  return attrs
}
