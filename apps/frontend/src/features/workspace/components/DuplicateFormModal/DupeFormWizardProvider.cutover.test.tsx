import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { act, renderHook } from '@testing-library/react'

import {
  CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
  featureFlags,
} from 'formsg-shared/constants'
import { FormOrigin, FormResponseMode } from 'formsg-shared/types'

import { usePreviewForm } from '~features/admin-form/common/queries'
import { useUser } from '~features/user/queries'
import {
  useDuplicateFormMutations,
  useEmailModeFeedbackMutation,
} from '~features/workspace/mutations'
import { useDashboard } from '~features/workspace/queries'

import { CreateFormFlowStates } from '../CreateFormModal/CreateFormWizardContext'

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

const setFlags = ({
  cutover,
  paperTracking,
}: {
  cutover: boolean
  paperTracking: boolean
}) => {
  vi.mocked(useFeatureIsOn).mockImplementation((flag: string) => {
    if (flag === featureFlags.mrfCutover) return cutover
    if (flag === featureFlags.enablePaperTrackingSetUpPage) return paperTracking
    return false
  })
}

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

  it('fires the storage dupe mutation with [user.email] fallback after escape hatch + submit', async () => {
    const { result } = renderHook(() =>
      useDupeFormWizardContext(vi.fn(), {
        formIdToDuplicate: MOCK_FORM_ID as any,
      }),
    )

    act(() => {
      result.current.goToStorageModeDetails()
      result.current.formMethods.setValue('title', 'New title')
    })
    await act(async () => {
      await result.current.handleCreateStorageModeOrMultirespondentForm()
    })

    expect(dupeStorageModeFormMutation.mutate).toHaveBeenCalledTimes(1)
    expect(dupeStorageModeFormMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        formIdToDuplicate: MOCK_FORM_ID,
        title: 'New title',
        responseMode: FormResponseMode.Encrypt,
        emails: [MOCK_USER_EMAIL],
      }),
      expect.anything(),
    )
    expect(dupeMultirespondentModeFormMutation.mutate).not.toHaveBeenCalled()
  })

  it('diverts to the origin step from details when paper tracking is enabled', async () => {
    setFlags({ cutover: true, paperTracking: true })
    const { result } = renderHook(() =>
      useDupeFormWizardContext(vi.fn(), {
        formIdToDuplicate: MOCK_FORM_ID as any,
      }),
    )

    act(() => result.current.formMethods.setValue('title', 'New title'))
    await act(async () => {
      await result.current.handleProceedFromDetails()
    })

    expect(result.current.currentStep).toBe(CreateFormFlowStates.Origin)
    expect(dupeMultirespondentModeFormMutation.mutate).not.toHaveBeenCalled()
    expect(dupeStorageModeFormMutation.mutate).not.toHaveBeenCalled()
  })

  it('submits only the new-process value when formOriginProcess is "new", discarding stale Q2 ticks', async () => {
    setFlags({ cutover: true, paperTracking: true })
    const { result } = renderHook(() =>
      useDupeFormWizardContext(vi.fn(), {
        formIdToDuplicate: MOCK_FORM_ID as any,
      }),
    )

    act(() => {
      result.current.formMethods.setValue('title', 'New title')
      result.current.formMethods.setValue('formOriginProcess', 'new')
      result.current.formMethods.setValue('formOrigins', {
        value: [FormOrigin.Paper],
      })
    })
    await act(async () => {
      await result.current.handleCreateStorageModeOrMultirespondentForm()
    })

    expect(dupeMultirespondentModeFormMutation.mutate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        metadata: {
          formOrigins: { value: [FormOrigin.DigitalNew] },
        },
      }),
    )
  })

  it('re-asks origins and duplicates with them as metadata', async () => {
    setFlags({ cutover: true, paperTracking: true })
    const { result } = renderHook(() =>
      useDupeFormWizardContext(vi.fn(), {
        formIdToDuplicate: MOCK_FORM_ID as any,
      }),
    )

    act(() => {
      result.current.formMethods.setValue('title', 'New title')
      result.current.formMethods.setValue('formOrigins', {
        value: [FormOrigin.Paper, CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: 'Fax',
      })
    })
    await act(async () => {
      await result.current.handleCreateStorageModeOrMultirespondentForm()
    })

    expect(dupeMultirespondentModeFormMutation.mutate).toHaveBeenCalledTimes(1)
    expect(dupeMultirespondentModeFormMutation.mutate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        metadata: {
          formOrigins: {
            value: [FormOrigin.Paper, CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
            othersInput: 'Fax',
          },
        },
      }),
    )
  })
})
