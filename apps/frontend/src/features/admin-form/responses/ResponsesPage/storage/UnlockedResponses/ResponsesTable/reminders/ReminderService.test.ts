import { ApiService } from '~services/ApiService'

import { sendReminderForPendingMrfResponse } from './ReminderService'

vi.mock('~services/ApiService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~services/ApiService')>()
  return {
    ...actual,
    ApiService: { post: vi.fn() },
  }
})

const mockPost = ApiService.post as unknown as ReturnType<typeof vi.fn>

const MOCK_FORM_ID = '61540ece3d4a6e50ac0cc6ff'
const MOCK_SUBMISSION_ID = '61540ece3d4a6e50ac0cc700'

beforeEach(() => {
  mockPost.mockReset()
  mockPost.mockResolvedValue({ data: undefined })
})

describe('sendReminderForPendingMrfResponse', () => {
  it('includes stepToken in the POST body when provided', async () => {
    await sendReminderForPendingMrfResponse({
      formId: MOCK_FORM_ID,
      submissionId: MOCK_SUBMISSION_ID,
      submissionSecretKey: 'submission-secret-key',
      stepToken: 'raw-step-token-abc123',
    })

    expect(mockPost).toHaveBeenCalledWith(expect.any(String), {
      submissionSecretKey: 'submission-secret-key',
      stepToken: 'raw-step-token-abc123',
    })
  })

  it('omits stepToken from the POST body when not provided', async () => {
    await sendReminderForPendingMrfResponse({
      formId: MOCK_FORM_ID,
      submissionId: MOCK_SUBMISSION_ID,
      submissionSecretKey: 'submission-secret-key',
    })

    const body = mockPost.mock.calls.at(-1)?.[1] as Record<string, unknown>
    expect(body).not.toHaveProperty('stepToken')
    expect(body).toEqual({ submissionSecretKey: 'submission-secret-key' })
  })
})
