// Prefixes in response emails, a space is included after the [field] for formatting
// The MyInfo prefix is shared with the MRF V1 webhook wire and the MRF admin
// surfaces, so shared owns the literal and this is a re-export of it.
export { MYINFO_QUESTION_PREFIX as MYINFO_PREFIX } from 'formsg-shared/utils/myinfo-prefix'

export const VERIFIED_PREFIX = '[verified] '
export const TABLE_PREFIX = '[table] '
export const ATTACHMENT_PREFIX = '[attachment] '
export const SIGNATURE_PREFIX = '[signature] '

// Parameters for hashing submissions
export const SALT_LENGTH = 32
export const HASH_ITERATIONS = 10000
export const KEY_LENGTH = 64
export const DIGEST_TYPE = 'sha512'
