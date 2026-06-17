import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { act, renderHook } from '@testing-library/react'

import { featureFlags } from 'formsg-shared/constants'
import { FormOrigin, FormResponseMode } from 'formsg-shared/types'

import { useFormTemplate } from '~features/admin-form/common/queries'
import { useUser } from '~features/user/queries'
import { CreateFormFlowStates } from '~features/workspace/components/CreateFormModal/CreateFormWizardContext'
import { useEmailModeFeedbackMutation } from '~features/workspace/mutations'

import { useUseTemplateMutations } from '../mutation'

import { useUseTemplateWizardContext } from './UseTemplateWizardProvider'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))
vi.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: vi.fn(),
}))
vi.mock('~features/admin-form/common/queries')
vi.mock('~features/user/queries')
vi.mock('~features/workspace/mutations')
vi.mock('../mutation')

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

const makeMockTemplateFormData = () => ({
  spcpSession: null,
  form: { title: 'Source', form_fields: [] },
})

describe('UseTemplateWizardProvider — cutover behaviour', () => {
  const useStorageModeFormTemplateMutation = {
    isLoading: false,
    mutate: vi.fn(),
  }
  const useMultirespondentFormTemplateMutation = {
    isLoading: false,
    mutate: vi.fn(),
  }
  const useEmailModeFormTemplateMutation = { isLoading: false, mutate: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useFeatureIsOn).mockReturnValue(true)

    vi.mocked(useFormTemplate).mockReturnValue({
      data: makeMockTemplateFormData() as any,
      isLoading: false,
    } as any)

    vi.mocked(useUser).mockReturnValue({
      user: { email: MOCK_USER_EMAIL } as any,
    } as any)

    vi.mocked(useUseTemplateMutations).mockReturnValue({
      useEmailModeFormTemplateMutation,
      useStorageModeFormTemplateMutation,
      useMultirespondentFormTemplateMutation,
    } as any)

    vi.mocked(useEmailModeFeedbackMutation).mockReturnValue({
      emailModeFeedbackMutation: { isLoading: false, mutate: vi.fn() },
    } as any)
  })

  it('defaults responseMode to Multirespondent when cutover is on', () => {
    const { result } = renderHook(() =>
      useUseTemplateWizardContext(MOCK_FORM_ID, vi.fn()),
    )

    expect(result.current.formMethods.getValues().responseMode).toBe(
      FormResponseMode.Multirespondent,
    )
  })

  it('fires the multirespondent template mutation on default submit', async () => {
    const { result } = renderHook(() =>
      useUseTemplateWizardContext(MOCK_FORM_ID, vi.fn()),
    )

    act(() => {
      result.current.formMethods.setValue('title', 'New title')
    })
    await act(async () => {
      await result.current.handleCreateStorageModeOrMultirespondentForm()
    })

    expect(useMultirespondentFormTemplateMutation.mutate).toHaveBeenCalledTimes(
      1,
    )
    expect(useMultirespondentFormTemplateMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        formIdToDuplicate: MOCK_FORM_ID,
        title: 'New title',
        responseMode: FormResponseMode.Multirespondent,
      }),
      expect.anything(),
    )
    expect(useStorageModeFormTemplateMutation.mutate).not.toHaveBeenCalled()
  })

  it('fires the storage template mutation with [user.email] fallback after escape hatch + submit', async () => {
    const { result } = renderHook(() =>
      useUseTemplateWizardContext(MOCK_FORM_ID, vi.fn()),
    )

    act(() => {
      result.current.goToStorageModeDetails()
      result.current.formMethods.setValue('title', 'New title')
    })
    await act(async () => {
      await result.current.handleCreateStorageModeOrMultirespondentForm()
    })

    expect(useStorageModeFormTemplateMutation.mutate).toHaveBeenCalledTimes(1)
    expect(useStorageModeFormTemplateMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        formIdToDuplicate: MOCK_FORM_ID,
        title: 'New title',
        responseMode: FormResponseMode.Encrypt,
        emails: [MOCK_USER_EMAIL],
      }),
      expect.anything(),
    )
    expect(useMultirespondentFormTemplateMutation.mutate).not.toHaveBeenCalled()
  })

  it('diverts to the origin step from details when paper tracking is enabled', async () => {
    setFlags({ cutover: true, paperTracking: true })
    const { result } = renderHook(() =>
      useUseTemplateWizardContext(MOCK_FORM_ID, vi.fn()),
    )

    act(() => result.current.formMethods.setValue('title', 'New title'))
    await act(async () => {
      await result.current.handleProceedFromDetails()
    })

    expect(result.current.currentStep).toBe(CreateFormFlowStates.Origin)
    expect(useMultirespondentFormTemplateMutation.mutate).not.toHaveBeenCalled()
    expect(useStorageModeFormTemplateMutation.mutate).not.toHaveBeenCalled()
  })

  it('re-asks origins and creates from template with them as metadata', async () => {
    setFlags({ cutover: true, paperTracking: true })
    const { result } = renderHook(() =>
      useUseTemplateWizardContext(MOCK_FORM_ID, vi.fn()),
    )

    act(() => {
      result.current.formMethods.setValue('title', 'New title')
      result.current.formMethods.setValue('formOrigins', {
        value: [FormOrigin.DigitalSpreadsheet],
      })
    })
    await act(async () => {
      await result.current.handleCreateStorageModeOrMultirespondentForm()
    })

    expect(useMultirespondentFormTemplateMutation.mutate).toHaveBeenCalledTimes(
      1,
    )
    expect(
      useMultirespondentFormTemplateMutation.mutate.mock.calls[0][0],
    ).toEqual(
      expect.objectContaining({
        metadata: {
          formOrigins: { value: [FormOrigin.DigitalSpreadsheet] },
        },
      }),
    )
  })
})
