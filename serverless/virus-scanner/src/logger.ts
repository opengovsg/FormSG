import { Context } from 'aws-lambda'
import pino, { Logger, LoggerOptions as PinoLoggerOptions } from 'pino'

// TODO (AUSTIN): This is a temporary workaround solution. The logger is duplicate from common/core and integration
// The reason for this dupe is because we are containerising this function within this package, and we cannot refer to parent packages if we want serverless.yml to exist within
// This folder
type LoggerOptions = {
  service: string
  prettyPrint?: boolean
  redact?: PinoLoggerOptions['redact']
  mixin?: PinoLoggerOptions['mixin']
}

function createBaseLogger({
  service,
  prettyPrint,
  redact,
  mixin,
}: LoggerOptions): Logger {
  const defaults: PinoLoggerOptions = {
    name: service,
    messageKey: 'message',
    redact,
    nestedKey: 'payload', // Any objects passed to logger will be nested in payload, so they don't pollute metadata
    base: undefined, // Disable logging of host and pid
    prettyPrint: prettyPrint ? { colorize: true } : undefined,
    // Add user readable level label text
    formatters: {
      level(label: string, number: number) {
        return { level: number, severity: label.toUpperCase() }
      },
    },
    // Add user readable datetime
    timestamp: prettyPrint
      ? () =>
          // User readable timestamp
          `"time":"${new Date().toLocaleString('en-SG', {
            timeZone: 'Asia/Singapore',
          })}"`
      : () =>
          // Log unix and user readable timestamp
          `,"time":"${Date.now()}","datetime":"${new Date().toLocaleString(
            'en-SG',
            {
              timeZone: 'Asia/Singapore',
            },
          )}"`,
    mixin,
  }

  return pino(defaults, pino.destination({ sync: true }))
}

const contextStore: { context?: Context } = {}

export interface LambdaLogger extends Logger {
  setContext: (context: Context) => void
}

export function getLambdaLogger(
  functionName: string,
  prettyPrint = false,
): LambdaLogger {
  const logger = createBaseLogger({
    service: functionName,
    redact: {
      paths: [
        'event.headers["x-api-key"]',
        'event.multiValueHeaders["x-api-key"]',
        'event.requestContext.*.apiKey',
      ],
      censor: (rawValue: string | string[], _) => {
        if (typeof rawValue === 'string') {
          return (
            '*'.repeat(rawValue.length - 6) +
            rawValue.slice(rawValue.length - 6)
          )
        }

        return rawValue.map(
          (val) => '*'.repeat(val.length - 6) + val.slice(val.length - 6),
        )
      },
    },
    prettyPrint,
    mixin: () => ({ reqId: contextStore.context?.awsRequestId }),
  }) as LambdaLogger

  logger.setContext = (context: Context) => {
    contextStore.context = context
  }

  return logger
}
