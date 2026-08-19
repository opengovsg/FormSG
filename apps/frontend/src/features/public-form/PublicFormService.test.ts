import { datadogLogs } from '@datadog/browser-logs'

import { getMultirespondentSubmissionById } from './PublicFormService'

vi.mock('@datadog/browser-logs', () => ({
  datadogLogs: { logger: { error: vi.fn() } },
}))

vi.mock('~services/ApiService', () => ({
  API_BASE_URL: '',
  ApiService: { get: vi.fn() },
  processFetchResponse: vi.fn(),
}))

vi.mock('./utils/decryptSubmission', () => ({
  convertEncryptedAttachmentToFileContent: (json: unknown) => json,
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiGet = (await import('~services/ApiService')).ApiService.get as any

const FORM_ID = 'form-1'
const SUBMISSION_ID = 'sub-1'

const mockSubmissionResponse = (attachmentMetadata: Record<string, string>) =>
  apiGet.mockResolvedValue({ data: { attachmentMetadata } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getMultirespondentSubmissionById', () => {
  it('should throw a user-facing error when S3 rejects the presigned URL', async () => {
    mockSubmissionResponse({ field1: 'https://s3.example/expired' })
    const json = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('<?xml version="1.0"?><Error/>'),
        json,
      }),
    )

    await expect(
      getMultirespondentSubmissionById({
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      }),
      // Must not surface as a SyntaxError from parsing S3's XML as JSON.
    ).rejects.toThrow(/could not be downloaded/)

    expect(json).not.toHaveBeenCalled()
  })

  it('should log the failing status and body to Datadog so the cause is diagnosable', async () => {
    mockSubmissionResponse({ field1: 'https://s3.example/expired' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('<?xml version="1.0"?><Error/>'),
        json: vi.fn(),
      }),
    )

    await expect(
      getMultirespondentSubmissionById({
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      }),
    ).rejects.toThrow()

    expect(datadogLogs.logger.error).toHaveBeenCalledWith(
      'MRF attachment download failed on client',
      expect.objectContaining({
        meta: expect.objectContaining({
          status: 403,
          formId: FORM_ID,
          submissionId: SUBMISSION_ID,
        }),
      }),
    )
  })

  it('should return the decoded attachments on a successful download', async () => {
    mockSubmissionResponse({ field1: 'https://s3.example/ok' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ encryptedFile: 'blob' }),
      }),
    )

    const result = await getMultirespondentSubmissionById({
      formId: FORM_ID,
      submissionId: SUBMISSION_ID,
    })

    expect(result.encryptedAttachments).toEqual({
      field1: { encryptedFile: 'blob' },
    })
    expect(datadogLogs.logger.error).not.toHaveBeenCalled()
  })

  it('should not fetch anything when the submission has no attachments', async () => {
    mockSubmissionResponse({})
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const result = await getMultirespondentSubmissionById({
      formId: FORM_ID,
      submissionId: SUBMISSION_ID,
    })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.encryptedAttachments).toEqual({})
  })
})
