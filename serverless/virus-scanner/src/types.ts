import { has } from 'lodash'

/**
 * Typeguard for checking if the event body has a key
 * @param body
 * @returns boolean
 */
type KeyBody = {
  key: string
}

export const isBodyWithKey = (body: unknown): body is KeyBody => {
  return (
    typeof body === 'object' &&
    !!body &&
    has(body, 'key') &&
    typeof (body as KeyBody).key === 'string'
  )
}

export type ScanFileStreamResult =
  | { isMalicious: true; virusMetadata: string[] }
  | { isMalicious: false; cleanFile: Buffer }
