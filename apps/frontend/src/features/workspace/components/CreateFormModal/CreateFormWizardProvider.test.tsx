import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { act, renderHook } from '@testing-library/react'

import {
  CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
  featureFlags,
} from 'formsg-shared/constants'
import { FormOrigin, FormResponseMode } from 'formsg-shared/types/form/form'

import { useUser } from '~features/user/queries'
import {
  useCreateFormMutations,
  useEmailModeFeedbackMutation,
} from '~features/workspace/mutations'
import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'

import { CreateFormFlowStates } from './CreateFormWizardContext'
import { useCreateFormWizardContext } from './CreateFormWizardProvider'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))
vi.mock('@growthbook/growthbook-react')
vi.mock('~features/workspace/mutations')
vi.mock('~features/user/queries')
vi.mock('~features/workspace/WorkspaceContext')
vi.mock('~utils/formSdk', () => ({
  default: {
    crypto: { generate: () => ({ publicKey: 'pk', secretKey: 'sk' }) },
  },
}))

const mrfMutation = { isLoading: false, mutate: vi.fn() }
const storageMutation = { isLoading: false, mutate: vi.fn() }

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

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useCreateFormMutations).mockReturnValue({
    createEmailModeFormMutation: { isLoading: false, mutate: vi.fn() },
    createStorageModeFormMutation: storageMutation,
    createMultirespondentModeFormMutation: mrfMutation,
  } as any)
  vi.mocked(useEmailModeFeedbackMutation).mockReturnValue({
    emailModeFeedbackMutation: { isLoading: false, mutate: vi.fn() },
  } as any)
  vi.mocked(useUser).mockReturnValue({
    user: { email: 'admin@example.com' },
  } as any)
  vi.mocked(useWorkspaceContext).mockReturnValue({
    activeWorkspace: { _id: 'ws1' },
    isDefaultWorkspace: false,
  } as any)
})

describe('useCreateFormWizardContext — paper-forms origin step', () => {
  it('diverts from the title step to the origin step when paper tracking is enabled', async () => {
    setFlags({ cutover: true, paperTracking: true })
    const { result } = renderHook(() => useCreateFormWizardContext(vi.fn()))

    act(() => result.current.formMethods.reset({ title: 'My form' }))
    await act(async () => {
      await result.current.handleProceedFromDetails()
    })

    expect(result.current.currentStep).toBe(CreateFormFlowStates.Origin)
    expect(mrfMutation.mutate).not.toHaveBeenCalled()
  })

  it('diverts to the origin step even when MRF cutover is off (decoupled pilot)', async () => {
    setFlags({ cutover: false, paperTracking: true })
    const { result } = renderHook(() => useCreateFormWizardContext(vi.fn()))

    act(() => result.current.formMethods.reset({ title: 'My form' }))
    await act(async () => {
      await result.current.handleProceedFromDetails()
    })

    expect(result.current.currentStep).toBe(CreateFormFlowStates.Origin)
    expect(storageMutation.mutate).not.toHaveBeenCalled()
    expect(mrfMutation.mutate).not.toHaveBeenCalled()
  })

  it('creates the storage-mode form with selected origins as metadata', async () => {
    setFlags({ cutover: false, paperTracking: true })
    const { result } = renderHook(() => useCreateFormWizardContext(vi.fn()))

    act(() =>
      result.current.formMethods.reset({
        title: 'My form',
        responseMode: FormResponseMode.Encrypt,
        formOriginProcess: 'existing',
        formOrigins: {
          value: [FormOrigin.Paper, FormOrigin.DigitalSpreadsheet],
        },
      }),
    )
    await act(async () => {
      await result.current.handleCreateStorageModeOrMultirespondentForm()
    })

    expect(storageMutation.mutate).toHaveBeenCalledTimes(1)
    expect(storageMutation.mutate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        metadata: {
          formOrigins: {
            value: [FormOrigin.Paper, FormOrigin.DigitalSpreadsheet],
          },
        },
      }),
    )
  })

  it('creates the MRF form with selected origins as metadata', async () => {
    setFlags({ cutover: true, paperTracking: true })
    const { result } = renderHook(() => useCreateFormWizardContext(vi.fn()))

    act(() =>
      result.current.formMethods.reset({
        title: 'My form',
        responseMode: FormResponseMode.Multirespondent,
        formOriginProcess: 'existing',
        formOrigins: {
          value: [FormOrigin.Paper, FormOrigin.DigitalSpreadsheet],
        },
      }),
    )
    await act(async () => {
      await result.current.handleCreateStorageModeOrMultirespondentForm()
    })

    expect(mrfMutation.mutate).toHaveBeenCalledTimes(1)
    expect(mrfMutation.mutate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        metadata: {
          formOrigins: {
            value: [FormOrigin.Paper, FormOrigin.DigitalSpreadsheet],
          },
        },
      }),
    )
  })

  it('carries the typed "Other" detail into metadata', async () => {
    setFlags({ cutover: true, paperTracking: true })
    const { result } = renderHook(() => useCreateFormWizardContext(vi.fn()))

    act(() =>
      result.current.formMethods.reset({
        title: 'My form',
        responseMode: FormResponseMode.Multirespondent,
        formOriginProcess: 'existing',
        formOrigins: {
          value: [CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
          othersInput: 'Carrier pigeon',
        },
      }),
    )
    await act(async () => {
      await result.current.handleCreateStorageModeOrMultirespondentForm()
    })

    expect(mrfMutation.mutate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        metadata: {
          formOrigins: {
            value: [CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
            othersInput: 'Carrier pigeon',
          },
        },
      }),
    )
  })

  it('preserves the origin selection (including "Other" text) across a Back→Forward round-trip and submits it unchanged', async () => {
    setFlags({ cutover: true, paperTracking: true })
    const { result } = renderHook(() => useCreateFormWizardContext(vi.fn()))

    // Arrive on the origin step with a title and an origin selection that
    // includes the "Other" sentinel plus free text.
    act(() =>
      result.current.formMethods.reset({
        title: 'My form',
        responseMode: FormResponseMode.Multirespondent,
        formOriginProcess: 'existing',
        formOrigins: {
          value: [FormOrigin.Paper, CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
          othersInput: 'Carrier pigeon',
        },
      }),
    )
    await act(async () => {
      await result.current.handleProceedFromDetails()
    })
    expect(result.current.currentStep).toBe(CreateFormFlowStates.Origin)

    // Navigate Back to the title step.
    act(() => result.current.goToFormDetails())
    expect(result.current.currentStep).toBe(CreateFormFlowStates.Details)

    // The selection is NOT cleared on Back — it persists in formMethods.
    expect(result.current.formMethods.getValues('formOrigins')).toEqual({
      value: [FormOrigin.Paper, CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
      othersInput: 'Carrier pigeon',
    })

    // Return forward to the origin step; the prior selection is still there
    // for the Controller to re-hydrate.
    await act(async () => {
      await result.current.handleProceedFromDetails()
    })
    expect(result.current.currentStep).toBe(CreateFormFlowStates.Origin)
    expect(result.current.formMethods.getValues('formOrigins')).toEqual({
      value: [FormOrigin.Paper, CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
      othersInput: 'Carrier pigeon',
    })

    // Submitting from there produces the same origin metadata it would have
    // without the Back→Forward round-trip.
    await act(async () => {
      await result.current.handleCreateStorageModeOrMultirespondentForm()
    })
    expect(mrfMutation.mutate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        metadata: {
          formOrigins: {
            value: [FormOrigin.Paper, CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
            othersInput: 'Carrier pigeon',
          },
        },
      }),
    )
  })

  it('submits only the new-process value when formOriginProcess is "new", discarding stale Q2 ticks', async () => {
    setFlags({ cutover: true, paperTracking: true })
    const { result } = renderHook(() => useCreateFormWizardContext(vi.fn()))

    act(() =>
      result.current.formMethods.reset({
        title: 'My form',
        responseMode: FormResponseMode.Multirespondent,
        formOriginProcess: 'new',
        // Stale Q2 state left over from before the admin switched to "new".
        formOrigins: { value: [FormOrigin.Paper] },
      }),
    )
    await act(async () => {
      await result.current.handleCreateStorageModeOrMultirespondentForm()
    })

    expect(mrfMutation.mutate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        metadata: {
          formOrigins: { value: [FormOrigin.DigitalNew] },
        },
      }),
    )
  })

  it('exposes the "Next step" proceed label when paper tracking is enabled', () => {
    setFlags({ cutover: true, paperTracking: true })
    const { result } = renderHook(() => useCreateFormWizardContext(vi.fn()))

    expect(result.current.proceedCtaLabel).toBe(
      'features.workspace.modals.forms.create.details.next',
    )
  })

  it('exposes the "Create" proceed label when paper tracking is disabled', () => {
    setFlags({ cutover: true, paperTracking: false })
    const { result } = renderHook(() => useCreateFormWizardContext(vi.fn()))

    expect(result.current.proceedCtaLabel).toBe(
      'features.workspace.modals.forms.create.details.create',
    )
  })

  it('creates directly from the title step without metadata when paper tracking is off', async () => {
    setFlags({ cutover: true, paperTracking: false })
    const { result } = renderHook(() => useCreateFormWizardContext(vi.fn()))

    act(() =>
      result.current.formMethods.reset({
        title: 'My form',
        responseMode: FormResponseMode.Multirespondent,
        formOrigins: { value: [FormOrigin.Paper] },
      }),
    )
    await act(async () => {
      await result.current.handleProceedFromDetails()
    })

    expect(result.current.currentStep).toBe(CreateFormFlowStates.Details)
    expect(mrfMutation.mutate).toHaveBeenCalledTimes(1)
    expect(mrfMutation.mutate.mock.calls[0][0]).not.toHaveProperty('metadata')
  })
})
