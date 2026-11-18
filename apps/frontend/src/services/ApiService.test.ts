import { InternalAxiosRequestConfig } from 'axios'

import { X_FORMSG_CLIENT_VERSION } from 'formsg-shared/constants'

import { ApiService } from './ApiService'

const MOCK_VERSION = '9.35.0'

/** Sends a request through ApiService, returning the headers it would send. */
const getSentHeaders = async (url: string) => {
  let sentConfig: InternalAxiosRequestConfig | undefined
  await ApiService.post(url, null, {
    adapter: async (config) => {
      sentConfig = config
      return { data: null, status: 200, statusText: 'OK', headers: {}, config }
    },
  })
  return sentConfig?.headers
}

describe('ApiService client version header', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_APP_VERSION', MOCK_VERSION)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should send the client version on requests to our own API', async () => {
    const headers = await getSentHeaders('/admin/forms')

    expect(headers?.get(X_FORMSG_CLIENT_VERSION)).toBe(MOCK_VERSION)
  })

  // Presigned uploads go through ApiService; a custom header would trigger a
  // CORS preflight that the S3 bucket may reject, breaking uploads.
  it('should not send the client version on cross-origin requests', async () => {
    const headers = await getSentHeaders(
      'https://s3.ap-southeast-1.amazonaws.com/mock-bucket',
    )

    expect(headers?.has(X_FORMSG_CLIENT_VERSION)).toBe(false)
  })
})
