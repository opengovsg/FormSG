import { ObjectId } from 'bson'
import { merge } from 'lodash'

import { IVerificationField } from 'src/types'

export const MOCK_SIGNED_DATA = 'mockSignedData'
export const MOCK_HASHED_OTP = 'mockHashedOtp'
export const MOCK_OTP = '123456'
export const MOCK_OTP_PREFIX = 'ABC'
export const MOCK_LOCAL_RECIPIENT = '+6581234567'
export const MOCK_INTL_RECIPIENT = '+011234567890'
export const MOCK_SENDER_IP = '200.0.0.0'

export const VFN_FIELD_DEFAULTS = {
  signedData: null,
  hashedOtp: null,
  hashCreatedAt: null,
  hashRetries: 0,
  otpRequests: 0,
}

export const generateFieldParams = (
  customOptions: Partial<IVerificationField> & { _id?: string } = {},
) => {
  const mockParams = {
    fieldType: 'mobile',
    _id: String(new ObjectId()),
    ...customOptions,
  }
  return merge({}, VFN_FIELD_DEFAULTS, mockParams)
}

/**
 * Parameters in verification schema with no defaults
 */
export const VFN_PARAMS = {
  formId: new ObjectId(),
}

/**
 * Parameters in verification schema with defaults
 */
export const VFN_DEFAULTS = {
  fields: [],
}
