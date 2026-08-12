import { ApiService } from '~services/ApiService'

import { cancelPendingMrfResponse } from './CancellationService'

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

describe('cancelPendingMrfResponse', () => {
  it('POSTs to the cancel endpoint for the given form and submission', async () => {
    await cancelPendingMrfResponse({
      formId: MOCK_FORM_ID,
      submissionId: MOCK_SUBMISSION_ID,
    })

    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining(
        `/${MOCK_FORM_ID}/submissions/${MOCK_SUBMISSION_ID}/cancel`,
      ),
    )
  })
})
