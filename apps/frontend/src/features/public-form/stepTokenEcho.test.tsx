import { ApiService } from '~services/ApiService'

import { updateMultirespondentSubmission } from './PublicFormService'

vi.mock('~services/ApiService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~services/ApiService')>()
  return {
    ...actual,
    ApiService: { put: vi.fn(), post: vi.fn() },
  }
})

const MOCK_FORM_ID = '61540ece3d4a6e50ac0cc6ff'
const MOCK_SUBMISSION_ID = '61540ece3d4a6e50ac0cc700'

const mockPut = ApiService.put as unknown as ReturnType<typeof vi.fn>

const putBodyFromLastCall = (): Record<string, unknown> => {
  const lastCall = mockPut.mock.calls.at(-1)
  if (!lastCall) throw new Error('ApiService.put was not called')
  const formData = lastCall[1] as FormData
  return JSON.parse(formData.get('body') as string)
}

beforeEach(() => {
  mockPut.mockReset()
  mockPut.mockResolvedValue({
    data: { submissionId: MOCK_SUBMISSION_ID, timestamp: 1700000000000 },
  })
})

const NEXT_STEP_ARGS = {
  formFields: [],
  formLogics: [],
  formInputs: {},
  responseMetadata: undefined,
}

describe('frontend step-token echoes to next-step PUT body', () => {
  it('includes the step token as `stepToken` in the PUT body when a token is present', async () => {
    await updateMultirespondentSubmission({
      ...NEXT_STEP_ARGS,
      formId: MOCK_FORM_ID,
      submissionId: MOCK_SUBMISSION_ID,
      fieldIdToQuarantineKeyMap: [],
      submissionSecretKey: 'submission-secret-key',
      stepToken: 'raw-step-token-abc123',
    })

    expect(putBodyFromLastCall()).toMatchObject({
      stepToken: 'raw-step-token-abc123',
    })
  })

  it('omits `stepToken` from the PUT body when no token is present', async () => {
    await updateMultirespondentSubmission({
      ...NEXT_STEP_ARGS,
      formId: MOCK_FORM_ID,
      submissionId: MOCK_SUBMISSION_ID,
      fieldIdToQuarantineKeyMap: [],
      submissionSecretKey: 'submission-secret-key',
      // stepToken intentionally omitted
    })

    expect(putBodyFromLastCall()).not.toHaveProperty('stepToken')
  })
})
