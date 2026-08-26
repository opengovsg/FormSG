import { IOneVarsSchema } from 'src/types'

import { isOneConfigured } from './one.config'

jest.mock('src/app/config/logger', () => ({
  createLoggerWithLabel: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}))

const VALID_CONFIG: IOneVarsSchema = {
  discoveryUrl: 'https://one.example.com/.well-known/openid-configuration',
  clientId: 'UEKmgAFwfuCLNFvNohmTQpptwWABQaPi',
  clientSecret: 'real-secret',
}

describe('isOneConfigured', () => {
  it('returns true when all values are real', () => {
    expect(isOneConfigured(VALID_CONFIG)).toBe(true)
  })

  it('returns false when discoveryUrl is still the placeholder', () => {
    expect(
      isOneConfigured({
        ...VALID_CONFIG,
        discoveryUrl:
          'https://placeholder.one.gov.sg/.well-known/openid-configuration',
      }),
    ).toBe(false)
  })

  it('returns false when clientSecret is still the placeholder', () => {
    expect(
      isOneConfigured({ ...VALID_CONFIG, clientSecret: 'use_placeholder' }),
    ).toBe(false)
  })

  it('returns false when discoveryUrl is not a valid URL', () => {
    expect(
      isOneConfigured({ ...VALID_CONFIG, discoveryUrl: 'not-a-url' }),
    ).toBe(false)
  })

  it('returns false when clientId is empty', () => {
    expect(isOneConfigured({ ...VALID_CONFIG, clientId: '' })).toBe(false)
  })
})
