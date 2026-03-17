/* eslint-env jest */
const matchers = require('jest-extended')
expect.extend(matchers)

/* Mocking ESM-only libraries as ts-jest doesn't support them */
jest.mock('openid-client', () => ({
  ClientSecretPost: jest.fn(),
  discovery: jest.fn().mockImplementation(() => {
    return Promise.resolve({
      issuer: 'https://mock-issuer.com',
      client_id: 'mock-client-id',
      client_secret: 'mock-client-secret',
      redirect_uris: ['https://mock-redirect-uri.com'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_post',
    })
  }),
}))
jest.mock('oauth4webapi', () => ({
  // Mock implementation
  getValidatedIdTokenClaims: jest.fn().mockImplementation(() => {
    return Promise.resolve({
      sub: 'mock-subject',
      email: 'mock-email@example.com',
    })
  }),
}))
/* Finish mocking ESM-only libraries as ts-jest doesn't support them */
