import hasAnsi from 'has-ansi'
import omit from 'lodash/omit'
import logform from 'logform'
import path from 'path'
import tripleBeam from 'triple-beam'
import { inspect } from 'util'
import { v4 as uuidv4 } from 'uuid'
import { format, Logger, LoggerOptions, loggers, transports } from 'winston'
import WinstonCloudWatch from 'winston-cloudwatch'

import defaults from './defaults'

// Params to enforce the logging format.
type CustomLoggerParams = {
  message: string
  meta: {
    action: string
    [other: string]: any
  }
  error?: Error
}

// Cannot use config due to logger being instantiated first, and
// having circular dependencies.
const isDev = ['development', 'test'].includes(process.env.NODE_ENV)
const customCloudWatchGroup = process.env.CUSTOM_CLOUDWATCH_LOG_GROUP
const awsRegion = process.env.AWS_REGION || defaults.aws.region

// A variety of helper functions to make winston logging like console logging,
// allowing multiple arguments.
// Retrieved from
// https://github.com/winstonjs/winston/issues/1427#issuecomment-583199496.

/**
 * Hunts for errors in the given object passed to the logger.
 * Assigns the `error` key the found error.
 */
const errorHunter = logform.format((info) => {
  if (info.error) return info

  const splat = info[tripleBeam.SPLAT as any] || []
  info.error = splat.find((obj: any) => obj instanceof Error)

  return info
})

/**
 * Formats the error in the transformable info to a console.error-like format.
 */
const errorPrinter = logform.format((info) => {
  if (!info.error) return info

  // Handle case where Error has no stack.
  const errorMsg = info.error.stack || info.error.toString()
  info.message += `\n${errorMsg}`

  return info
})

/**
 * Standard function to check if the passed in value is a primitive type.
 * @param val the value to check
 * @returns true if the value is a primitive.
 */
const isPrimitive = (val: any): boolean => {
  return val === null || (typeof val !== 'object' && typeof val !== 'function')
}

/**
 * Formats the provided value into a string representation for logging.
 * Uses inspect
 * (https://nodejs.org/api/util.html#util_util_inspect_object_options) to format
 * non-primitive types.
 * @param val the value to format
 * @returns the string presentation of the value passed in
 */
const formatWithInspect = (val: any): string => {
  if (val instanceof Error) {
    return ''
  }

  const shouldFormat = typeof val !== 'string' && !hasAnsi(val)
  const formattedVal = shouldFormat
    ? inspect(val, { depth: null, colors: true })
    : val

  return isPrimitive(val) ? formattedVal : `\n${formattedVal}`
}

/**
 * A custom formatter for winston. Transforms winston's info object into a
 * string representation, mainly used for console logging.
 */
export const customFormat = format.printf((info) => {
  let duration = info.durationMs || info.responseTime
  duration = duration ? `duration=${duration}ms ` : ''

  // Handle single object without message
  if (!info.message) {
    const obj = omit(info, ['level', 'timestamp', Symbol.for('level')])
    return `${info.timestamp} ${info.level} [${
      info.label
    }]: ${formatWithInspect(obj)} ${duration}`
  }

  // Handle multiple arguments passed into logger
  // e.g. logger.info('param1', 'param2')
  // The second parameter onwards will be passed into the `splat` key and
  // require formatting (because that is just how the library is written).
  const splatSymbol = (Symbol.for('splat') as unknown) as string
  const splatArgs = info[splatSymbol] || []
  const rest = splatArgs.map((data: any) => formatWithInspect(data)).join(' ')
  const msg = formatWithInspect(info.message)

  return `${info.timestamp} ${info.level} [${info.label}]: ${msg}\t${duration}\t${rest}`
})

/**
 * This is required as JSON.stringify(new Error()) returns an empty object. This
 * function converts the error in `info.error` into a readable JSON stack trace.
 *
 * Function courtesy of
 * https://github.com/winstonjs/winston/issues/1243#issuecomment-463548194.
 */
const jsonErrorReplacer = (_key: never, value: any) => {
  if (value instanceof Error) {
    return Object.getOwnPropertyNames(value).reduce((all, valKey) => {
      if (valKey === 'stack') {
        return {
          ...all,
          at: value[valKey]
            .split('\n')
            .filter((va) => va.trim().slice(0, 5) != 'Error')
            .map((va, i) => `stack ${i} ${va.trim().slice(3).trim()}`),
        }
      } else {
        return {
          ...all,
          [valKey]: value[valKey],
        }
      }
    }, {})
  } else {
    return value
  }
}

/**
 * Creates logger options for use by winston.
 * @param label The label of the logger
 * @returns the created options
 */
const createLoggerOptions = (label: string): LoggerOptions => {
  return {
    level: 'debug',
    format: format.combine(
      format.errors({ stack: true }),
      format.label({ label }),
      format.timestamp(),
      errorHunter(),
      !isDev
        ? format.combine(format.colorize(), errorPrinter(), customFormat)
        : format.json({ replacer: jsonErrorReplacer }),
    ),
    transports: [
      new transports.Console({
        silent: process.env.NODE_ENV === 'test',
      }),
    ],
    exitOnError: false,
  }
}

/**
 * Returns a label from the given module
 * @example loaders/index.ts
 * @param callingModule
 */
const getModuleLabel = (callingModule: NodeModule) => {
  // Remove the file extension from the filename and split with path separator.
  const parts = callingModule.filename.replace(/\.[^/.]+$/, '').split(path.sep)
  // Join the last two parts of the file path together.
  return path.join(parts[parts.length - 2], parts.pop())
}

/**
 * Overrides the given winston logger with a new signature, so as to enforce a
 * log format.
 * @param logger the logger to override
 */
const createCustomLogger = (logger: Logger) => {
  return {
    info: ({ message, meta }: Omit<CustomLoggerParams, 'error'>) =>
      logger.info(message, { meta }),
    warn: ({ message, meta, error }: CustomLoggerParams) => {
      if (error) {
        return logger.warn(message, { meta }, error)
      }
      return logger.warn(message, { meta })
    },
    error: ({ message, meta, error }: CustomLoggerParams) => {
      if (error) {
        return logger.error(message, { meta }, error)
      }
      return logger.error(message, { meta })
    },
  }
}

/**
 * Create a new winston logger with given module
 * @param callingModule the module to create a logger for
 */
export const createLoggerWithLabel = (callingModule: NodeModule) => {
  const label = getModuleLabel(callingModule)
  loggers.add(label, createLoggerOptions(label))
  return createCustomLogger(loggers.get(label))
}

/**
 * Creates a logger which logs to the CloudWatch group specified by config.
 * If this group is not specified, creates a default logger.
 * @param label The label of the logger
 */
export const createCloudWatchLogger = (label: string) => {
  // If config does not define a short-term CloudWatch log group, default
  // to the standard logger
  const loggerOptions = createLoggerOptions(label)
  if (!isDev && customCloudWatchGroup) {
    loggerOptions.transports = [
      new WinstonCloudWatch({
        logGroupName: customCloudWatchGroup,
        // Every EC2 instance needs its own unique stream name, or else they
        // will run into InvalidSequenceTokenException errors because they do
        // not share sequence tokens. Hence generate a unique ID for each instance
        // of the logger.
        logStreamName: uuidv4(),
        awsRegion,
        jsonMessage: true,
      }),
    ]
  }
  loggers.add(label, loggerOptions)
  return loggers.get(label)
}
