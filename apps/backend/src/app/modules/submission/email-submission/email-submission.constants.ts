// Prefixes in response emails, a space is included after the [field] for formatting
export { ATTACHMENT_QUESTION_PREFIX as ATTACHMENT_PREFIX } from 'formsg-shared/constants'
export { MYINFO_QUESTION_PREFIX as MYINFO_PREFIX } from 'formsg-shared/utils/myinfo-prefix'

export const VERIFIED_PREFIX = '[verified] '
export const TABLE_PREFIX = '[table] '
export const SIGNATURE_PREFIX = '[signature] '

// Parameters for hashing submissions
export const SALT_LENGTH = 32
export const HASH_ITERATIONS = 10000
export const KEY_LENGTH = 64
export const DIGEST_TYPE = 'sha512'
