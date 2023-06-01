import winston, { Logger } from 'winston'

interface MockLogger extends Logger {
  log: jest.Mock
  warn: jest.Mock
  error: jest.Mock
  info: jest.Mock
  profile: jest.Mock
}

const getMockLogger = (): MockLogger => {
  const logger = winston.createLogger()
  logger.log = jest.fn()
  logger.error = jest.fn()
  logger.warn = jest.fn()
  logger.info = jest.fn()
  logger.profile = jest.fn()
  return logger as MockLogger
}

export default getMockLogger
