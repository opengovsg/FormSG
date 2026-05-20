import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { act, renderHook } from '@testing-library/react'

import { FormResponseMode } from 'formsg-shared/types'

import { usePreviewForm } from '~features/admin-form/common/queries'
import { useUser } from '~features/user/queries'
import {
  useDuplicateFormMutations,
  useEmailModeFeedbackMutation,
} from '~features/workspace/mutations'
import { useDashboard } from '~features/workspace/queries'

import { useDupeFormWizardContext } from './DupeFormWizardProvider'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))
vi.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: vi.fn(),
}))
vi.mock('~features/workspace/queries')
vi.mock('~features/admin-form/common/queries')
vi.mock('~features/workspace/mutations')
vi.mock('~features/user/queries')

const MOCK_FORM_ID = 'form123'
const MOCK_USER_EMAIL = 'admin@example.com'

const makeMockPreviewFormData = (responseMode = FormResponseMode.Encrypt) => ({
  spcpSession: null,
  form: { title: 'Source', form_fields: [], responseMode },
})

describe('DupeFormWizardProvider — cutover behaviour', () => {
  const dupeStorageModeFormMutation = { isLoading: false, mutate: vi.fn() }
  const dupeMultirespondentModeFormMutation = {
    isLoading: false,
    mutate: vi.fn(),
  }
  const dupeEmailModeFormMutation = { isLoading: false, mutate: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useFeatureIsOn).mockReturnValue(true)

    vi.mocked(usePreviewForm).mockReturnValue({
      data: makeMockPreviewFormData(FormResponseMode.Encrypt) as any,
      isLoading: false,
    } as any)

    vi.mocked(useDashboard).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)

    vi.mocked(useUser).mockReturnValue({
      user: { email: MOCK_USER_EMAIL } as any,
    } as any)

    vi.mocked(useDuplicateFormMutations).mockReturnValue({
      dupeEmailModeFormMutation,
      dupeStorageModeFormMutation,
      dupeMultirespondentModeFormMutation,
    } as any)

    vi.mocked(useEmailModeFeedbackMutation).mockReturnValue({
      emailModeFeedbackMutation: { isLoading: false, mutate: vi.fn() },
    } as any)
  })

  it('defaults responseMode to Multirespondent when cutover is on, regardless of source mode', () => {
    const { result } = renderHook(() =>
      useDupeFormWizardContext(vi.fn(), {
        formIdToDuplicate: MOCK_FORM_ID as any,
      }),
    )

    expect(result.current.formMethods.getValues().responseMode).toBe(
      FormResponseMode.Multirespondent,
    )
  })

  it('fires the multirespondent dupe mutation on default submit', async () => {
    const { result } = renderHook(() =>
      useDupeFormWizardContext(vi.fn(), {
        formIdToDuplicate: MOCK_FORM_ID as any,
      }),
    )

    act(() => {
      result.current.formMethods.setValue('title', 'New title')
    })
    await act(async () => {
      await result.current.handleCreateStorageModeOrMultirespondentForm()
    })

    expect(dupeMultirespondentModeFormMutation.mutate).toHaveBeenCalledTimes(1)
    expect(dupeMultirespondentModeFormMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        formIdToDuplicate: MOCK_FORM_ID,
        title: 'New title',
        responseMode: FormResponseMode.Multirespondent,
      }),
      expect.anything(),
    )
    expect(dupeStorageModeFormMutation.mutate).not.toHaveBeenCalled()
  })
})
