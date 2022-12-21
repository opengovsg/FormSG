import { jest } from '@jest/globals'
import { Twilio } from 'twilio'

// Mocks the underlying twilio import
// This allows us to inject values into twilio dynamically without having to be verbose
// This is casted for type annotations
const twilio = {
  messages: {
    create: jest.fn(),
  },
} as unknown as Twilio

// Mocks the default twilio argument
jest.mock('twilio', () => () => twilio)

const MockTwilio = jest.mocked(twilio)

export default MockTwilio
