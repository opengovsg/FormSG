// Configuration for `winston` package.
import hasAnsi from 'has-ansi'
import omit from 'lodash/omit'
import { inspect } from 'util'
import { v4 as uuidv4 } from 'uuid'
import { format, LoggerOptions, loggers, transports } from 'winston'
import WinstonCloudWatch from 'winston-cloudwatch'

import { aws, customCloudWatchGroup } from './config'

// Cannot use config's isDev due to logger being instantiated first, and
// having circular dependencies.
const isDev = ['development', 'test'].includes(process.env.NODE_ENV)

// Config to make winston logging like console logging, allowing multiple
// arguments.
// Retrieved from
// https://github.com/winstonjs/winston/issues/1427#issuecomment-583199496.

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
  const stackTrace = info.stack ? `\n${info.stack}` : ''
  let duration = info.durationMs || info.responseTime
  duration = duration ? `duration=${duration}ms ` : ''

  // Handle single object without message
  if (!info.message) {
    const obj = omit(info, ['level', 'timestamp', Symbol.for('level')])
    return `${info.timestamp} ${info.level} [${
      info.label
    }]: ${formatWithInspect(obj)} ${duration}${stackTrace}`
  }

  // Handle multiple arguments passed into logger
  // e.g. logger.info('param1', 'param2')
  // The second parameter onwards will be passed into the `splat` key and
  // require formatting (because that is just how the library is written).
  const splatSymbol = (Symbol.for('splat') as unknown) as string
  const splatArgs = info[splatSymbol] || []
  const rest = splatArgs.map((data: any) => formatWithInspect(data)).join(' ')
  const msg = formatWithInspect(info.message)

  return `${info.timestamp} ${info.level} [${info.label}]: ${msg} ${duration}${rest}${stackTrace}`
})

/**
 * Creates logger options for use by winston.
 * @param label The label of the logger
 * @returns the created options
 */
const createLoggerOptions = (label: string): LoggerOptions => {
  return {
    level: 'debug',
    format: format.combine(
      format.label({ label }),
      format.timestamp(),
      isDev ? format.combine(format.colorize(), customFormat) : format.json(),
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
 * Create a new winston logger with given label
 * @param label The label of the logger
 */
export const createLoggerWithLabel = (label: string) => {
  loggers.add(label, createLoggerOptions(label))
  return loggers.get(label)
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
        awsRegion: aws.region,
        jsonMessage: true,
      }),
    ]
  }
  loggers.add(label, loggerOptions)
  return loggers.get(label)
}
