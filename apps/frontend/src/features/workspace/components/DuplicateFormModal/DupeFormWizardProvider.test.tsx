import { act, renderHook } from '@testing-library/react'

import { usePreviewForm } from '~features/admin-form/common/queries'
import { useUser } from '~features/user/queries'
import {
  useDuplicateFormMutations,
  useEmailModeFeedbackMutation,
} from '~features/workspace/mutations'
import { useDashboard } from '~features/workspace/queries'

import { CreateFormFlowStates } from '../CreateFormModal/CreateFormWizardContext'
import { useCommonFormWizardProvider } from '../CreateFormModal/CreateFormWizardProvider'

import { useDupeFormWizardContext } from './DupeFormWizardProvider'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))
vi.mock('~features/workspace/queries')
vi.mock('~features/admin-form/common/queries')
vi.mock('~features/workspace/mutations')
vi.mock('~features/user/queries')
vi.mock('../CreateFormModal/CreateFormWizardProvider')

const MOCK_FORM_TITLE = 'My Test Form'
const MOCK_FORM_ID = 'form123'

const makeMockPreviewFormData = (title = MOCK_FORM_TITLE) => ({
  spcpSession: null,
  form: { title, form_fields: [] },
})

const makeMockDashboardForms = (titles: string[] = []) =>
  titles.map((title, i) => ({ _id: `id${i}`, title }))

describe('DupeFormWizardProvider', () => {
  const mockReset = vi.fn()
  const mockMutation = { isLoading: false, mutate: vi.fn() }
  let currentStep: CreateFormFlowStates

  beforeEach(() => {
    vi.clearAllMocks()
    currentStep = CreateFormFlowStates.Details

    vi.mocked(useCommonFormWizardProvider).mockImplementation(() => ({
      formMethods: {
        reset: mockReset,
        getValues: vi.fn().mockReturnValue({}),
        handleSubmit: vi.fn(),
        setValue: vi.fn(),
      } as any,
      currentStep,
      direction: 1 as const,
      keypair: { publicKey: 'pk', secretKey: 'sk' } as any,
      setCurrentStep: vi.fn(),
      isMrfCutoverEnabled: false,
      isPaperTrackingSetUpPageEnabled: false,
      goToStorageModeDetails: vi.fn(),
      goToMrfDetails: vi.fn(),
      goToFormDetails: vi.fn(),
      makeHandleProceedFromDetails: vi.fn(() => vi.fn()),
    }))

    vi.mocked(usePreviewForm).mockReturnValue({
      data: makeMockPreviewFormData() as any,
      isLoading: false,
    } as any)

    vi.mocked(useDashboard).mockReturnValue({
      data: makeMockDashboardForms(),
      isLoading: false,
    } as any)

    vi.mocked(useUser).mockReturnValue({
      user: { email: 'test@example.com' } as any,
    } as any)

    vi.mocked(useDuplicateFormMutations).mockReturnValue({
      dupeEmailModeFormMutation: mockMutation as any,
      dupeStorageModeFormMutation: mockMutation as any,
      dupeMultirespondentModeFormMutation: mockMutation as any,
    } as any)

    vi.mocked(useEmailModeFeedbackMutation).mockReturnValue({
      emailModeFeedbackMutation: mockMutation as any,
    } as any)
  })

  it('should call reset() with a generated title on the Details step', () => {
    renderHook(() =>
      useDupeFormWizardContext(vi.fn(), {
        formIdToDuplicate: MOCK_FORM_ID as any,
      }),
    )

    expect(mockReset).toHaveBeenCalledTimes(1)
    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({ title: `${MOCK_FORM_TITLE}_1` }),
    )
  })

  it('should not call reset() when dashboardForms changes after moving past the Details step', () => {
    // Bug scenario: dashboard refetches after form is created, triggering useEffect
    // which previously overwrote the title used for the secret key filename.
    const { rerender } = renderHook(() =>
      useDupeFormWizardContext(vi.fn(), {
        formIdToDuplicate: MOCK_FORM_ID as any,
      }),
    )

    expect(mockReset).toHaveBeenCalledTimes(1)
    mockReset.mockClear()

    // Simulate: form was created, wizard moved to next step
    currentStep = CreateFormFlowStates.Landing
    // Simulate: dashboard refetches and now includes the newly created duplicate
    vi.mocked(useDashboard).mockReturnValue({
      data: makeMockDashboardForms([`${MOCK_FORM_TITLE}_1`]),
      isLoading: false,
    } as any)

    act(() => {
      rerender()
    })

    // reset() must NOT be called — this was the bug
    expect(mockReset).not.toHaveBeenCalledTimes(1)
  })

  it('should call reset() again when dashboardForms changes while still on the Details step', () => {
    // Confirm that the guard does not break legitimate re-computation of the title
    // while the user is still on the Details step (e.g. slow initial load).
    const { rerender } = renderHook(() =>
      useDupeFormWizardContext(vi.fn(), {
        formIdToDuplicate: MOCK_FORM_ID as any,
      }),
    )

    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({ title: `${MOCK_FORM_TITLE}_1` }),
    )
    mockReset.mockClear()

    // Still on Details step, dashboard updated (e.g. another form was added externally)
    vi.mocked(useDashboard).mockReturnValue({
      data: makeMockDashboardForms([`${MOCK_FORM_TITLE}_1`]),
      isLoading: false,
    } as any)

    act(() => {
      rerender()
    })

    // reset() should fire again with an updated title (_2 since _1 now exists)
    expect(mockReset).toHaveBeenCalledTimes(1)
    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({ title: `${MOCK_FORM_TITLE}_2` }),
    )
  })
})
