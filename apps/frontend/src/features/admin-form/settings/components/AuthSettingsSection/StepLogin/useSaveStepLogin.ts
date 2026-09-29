import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from 'react-query'

import {
  AdminFormDto,
  AdminMultirespondentFormDto,
  FormAuthType,
  FormSettings,
  FormWorkflowDto,
  WorkflowStepAuthType,
  WorkflowStepWriteDto,
} from 'formsg-shared/types'
import { ResolvedStepAuth } from 'formsg-shared/utils/workflow-auth'

import { ApiError } from '~typings/core'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'
import { buildWorkflowStep } from '~features/admin-form/create/workflow/components/WorkflowContent/EditStepBlock/EditStepBlock'
import { updateWorkflowStep } from '~features/admin-form/create/workflow/FormWorkflowService'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'

import { adminFormSettingsKeys } from '../../../queries'
import { updateFormLoginSettings } from '../../../SettingsService'

import {
  getRemovedMyInfoFieldIds,
  StepLoginDraft,
  toWhitelistCsvString,
} from './stepLoginDraft'
import { STEP_LOGIN_COPY_KEY } from './useStepLoginLabels'

interface SaveStepLoginVariables {
  form: AdminMultirespondentFormDto
  stepIndex: number
  saved: ResolvedStepAuth
  draft: StepLoginDraft
}

type SaveStepLoginResult =
  | { settings: FormSettings }
  | { workflow: FormWorkflowDto }

// Sends a step's whole login change, list included, as one request.
const saveStepLogin = async ({
  form,
  stepIndex,
  saved,
  draft,
}: SaveStepLoginVariables): Promise<SaveStepLoginResult> => {
  const hasLogin = draft.authType !== FormAuthType.NIL
  // Unchanged providers are omitted so a retired Step 1 provider is never rewritten.
  const authType =
    draft.authType === saved.authType ? undefined : draft.authType
  const isSubmitterIdCollectionEnabled =
    hasLogin && draft.isSubmitterIdCollectionEnabled
  const isSingleSubmission = hasLogin && draft.isSingleSubmission
  // The shared ID is entered in the row only while the form has none.
  const esrvcId =
    draft.authType === FormAuthType.CP && !form.esrvcId
      ? draft.esrvcId.trim()
      : undefined
  const whitelistCsvString = toWhitelistCsvString(saved, draft)

  if (form.workflow.length === 0) {
    const settings = await updateFormLoginSettings(form._id, {
      authType,
      isSubmitterIdCollectionEnabled,
      isSingleSubmission,
      esrvcId,
      whitelistCsvString,
    })
    return { settings }
  }

  const current = form.workflow[stepIndex]
  const removedFieldIds = getRemovedMyInfoFieldIds(
    form,
    stepIndex,
    draft.authType,
  )
  const step = buildWorkflowStep(
    {
      ...current,
      edit: current.edit.filter((id) => !removedFieldIds.includes(id)),
    } as EditStepInputs,
    stepIndex === 0,
  )
  if (!step) return Promise.reject(new Error('This step could not be saved.'))

  const body: WorkflowStepWriteDto =
    stepIndex === 0
      ? {
          ...step,
          first_step_login: {
            authType,
            isSubmitterIdCollectionEnabled,
            isSingleSubmission,
          },
          esrvc_id: esrvcId,
          whitelistCsvString,
        }
      : {
          ...step,
          auth: hasLogin
            ? {
                auth_type: draft.authType as WorkflowStepAuthType,
                is_submitter_id_collection_enabled:
                  isSubmitterIdCollectionEnabled,
              }
            : null,
          esrvc_id: esrvcId,
          whitelistCsvString,
        }
  const workflow = await updateWorkflowStep(form._id, stepIndex, body)
  return { workflow }
}

// Saves one step's login from Settings; the toast shows only after the save returns.
export const useSaveStepLogin = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })

  return useMutation<SaveStepLoginResult, ApiError, SaveStepLoginVariables>(
    saveStepLogin,
    {
      onSuccess: async (result, { form, stepIndex }) => {
        const adminFormKey = adminFormKeys.id(form._id)
        const settingsKey = adminFormSettingsKeys.id(form._id)
        if ('settings' in result) {
          queryClient.setQueryData(settingsKey, result.settings)
          queryClient.setQueryData<AdminFormDto | undefined>(
            adminFormKey,
            (prev) =>
              prev ? ({ ...prev, ...result.settings } as AdminFormDto) : prev,
          )
        } else {
          queryClient.setQueryData<AdminFormDto | undefined>(
            adminFormKey,
            (prev) => (prev ? { ...prev, workflow: result.workflow } : prev),
          )
          // Step 1 login and the e-service ID are form-level, which the workflow response omits.
          await Promise.all([
            queryClient.invalidateQueries(adminFormKey),
            queryClient.invalidateQueries(settingsKey),
          ])
        }
        toast.closeAll()
        toast({
          description: t(`${STEP_LOGIN_COPY_KEY}.editor.saved`, {
            stepNumber: stepIndex + 1,
          }),
        })
      },
      onError: (error, { form }) => {
        toast.closeAll()
        toast({ status: 'danger', description: error.message })
        // Refresh so a retry after a concurrent edit sends the latest step.
        void queryClient.invalidateQueries(adminFormKeys.id(form._id))
      },
    },
  )
}
