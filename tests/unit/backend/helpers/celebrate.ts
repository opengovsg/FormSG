import { Segments } from 'celebrate'
import { getReasonPhrase } from 'http-status-codes'
import { mapValues } from 'lodash'
/**
 * Maps the key type (e.g. param, body) to the required keys
 */
type ICelebrateSpec = {
  [s in Segments]?: {
    key: string
    message?: string
  }
}

/**
 * Options for customising celebrate error
 */
interface ICelebrateOpts {
  message?: string
  statusCode?: number
}

export const buildCelebrateError = (
  spec: ICelebrateSpec,
  opts: ICelebrateOpts = {},
) => {
  opts.message ??= 'Validation failed'
  opts.statusCode ??= 400
  return {
    statusCode: opts.statusCode,
    message: opts.message,
    error: getReasonPhrase(opts.statusCode),
    validation: mapValues(spec, (requirements, keyType) => {
      return (
        requirements && {
          source: keyType,
          keys: [requirements.key],
          message: requirements.message ?? `"${requirements.key}" is required`,
        }
      )
    }),
  }
}
