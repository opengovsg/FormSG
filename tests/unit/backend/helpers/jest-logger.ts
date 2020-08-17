import winston from 'winston'

const getMockLogger = () => {
  const logger = winston.createLogger()
  logger.log = jest.fn()
  logger.warn = jest.fn()
  logger.info = jest.fn()
  logger.profile = jest.fn()
  return logger
}

export default getMockLogger
