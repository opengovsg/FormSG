import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useParams } from 'react-router'
import { Stack, Text } from '@chakra-ui/react'

import {
  AdminMultirespondentFormDto,
  FormAuthType,
  FormStatus,
  FormWorkflowStepDto,
  MultirespondentFormSettings,
  WorkflowType,
} from 'formsg-shared/types'
import {
  getStepAuthType,
  getStepEsrvcId,
  isStepLoginAuthType,
  isWorkflowStepAuthType,
} from 'formsg-shared/utils/step-login'

import { useToast } from '~hooks/useToast'
import InlineMessage from '~components/InlineMessage'

import { updateWorkflowStep } from '~features/admin-form/create/workflow/FormWorkflowService'
import {
  StepLoginSwitch,
  useStepLoginSwitch,
} from '~features/admin-form/create/workflow/hooks/useStepLoginSwitch'
import { invalidateLoginQueries } from '~features/admin-form/create/workflow/mutations'
import {
  normaliseFirstStepLogin,
  normaliseStepAuth,
} from '~features/admin-form/create/workflow/workflow.utils'

import { isValidEsrvcId } from '../../utils'

import { AuthSwitchConfirmation } from './AuthSwitchConfirmation'
import { StepLoginControls } from './StepLoginControls'
import {
  createStepOneLoginRestrictionsDraft,
  saveStepOneLoginRestrictions,
  StepOneLoginRestrictions,
  StepOneLoginRestrictionsDraft,
} from './StepOneLoginRestrictions'

const STEP_COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin'
const COPY_KEY = `${STEP_COPY_KEY}.settings` as const

export interface StepLoginDraft {
  dirty: boolean
  pending: boolean
  save: () => Promise<boolean>
}
interface StepAuthSettingsEditorProps {
  form: AdminMultirespondentFormDto
  settings: MultirespondentFormSettings
  step: FormWorkflowStepDto
  stepIndex: number
  isDisabled: boolean
  registerDraft: (id: string, draft: StepLoginDraft | null) => void
  queueAfterSave?: (run: () => void) => void
  runSave: (
    id: string,
    action: () => Promise<void>,
    isEsrvcIdSave?: boolean,
  ) => Promise<boolean>
}

export const StepAuthSettingsEditor = ({
  form,
  settings,
  step,
  stepIndex,
  isDisabled,
  queueAfterSave,
  registerDraft,
  runSave,
}: StepAuthSettingsEditorProps): JSX.Element => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })
  const authType = getStepAuthType(settings, form.workflow, stepIndex)
  const savedEsrvcId = getStepEsrvcId(settings, form.workflow, stepIndex) ?? ''
  const [esrvcId, setEsrvcId] = useState(savedEsrvcId)
  const discardEsrvcIdDraft = () => setEsrvcId(savedEsrvcId)
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState('')
  const isPublic = form.status === FormStatus.Public
  const disabled = isPublic || isDisabled
  useEffect(() => setEsrvcId(savedEsrvcId), [savedEsrvcId])

  const persist = (
    action: (formId: string) => Promise<void>,
    isEsrvcIdSave = false,
  ) => {
    if (disabled || !formId) return Promise.resolve(false)
    return runSave(
      step._id,
      async () => {
        setError('')
        try {
          await action(formId)
          toast({ description: t(`${COPY_KEY}.saved`) })
        } catch (cause) {
          discardEsrvcIdDraft()
          setError(
            cause instanceof Error
              ? cause.message
              : t(`${COPY_KEY}.saveFailed`),
          )
          throw cause
        } finally {
          await invalidateLoginQueries(queryClient, formId)
        }
      },
      isEsrvcIdSave,
    )
  }
  const saveLogin = (change: StepLoginSwitch, nextEsrvcId: string) =>
    persist(async (formId) => {
      const unassigned = new Set(change.unassignedIds)
      const common = {
        delete_auth_field_ids: change.deletedIds,
        expected_last_modified: form.lastModified,
        edit: step.edit.filter((id) => !unassigned.has(id)),
      }
      await updateWorkflowStep(
        formId,
        stepIndex,
        stepIndex === 0
          ? {
              ...common,
              _id: step._id,
              workflow_type: WorkflowType.Static,
              emails: [],
              step_name: step.step_name,
              approval_field: step.approval_field,
              is_approval_enabled: step.is_approval_enabled,
              ...normaliseFirstStepLogin(
                isStepLoginAuthType(change.authType)
                  ? { auth_type: change.authType, esrvc_id: nextEsrvcId }
                  : undefined,
              ),
            }
          : {
              ...step,
              ...common,
              auth: normaliseStepAuth(
                isWorkflowStepAuthType(change.authType)
                  ? { auth_type: change.authType, esrvc_id: nextEsrvcId }
                  : null,
              ),
            },
      )
      setEsrvcId(nextEsrvcId.trim())
    }, change.authType === authType)
  const loginSwitch = useStepLoginSwitch({
    form,
    stepNumber: stepIndex,
    authType,
    assignedIds: step.edit,
    isDisabled: disabled || isParsing,
    onSwitch: (change) => {
      discardEsrvcIdDraft()
      void saveLogin(change, savedEsrvcId)
    },
  })
  const pending = loginSwitch.isPending || isParsing
  const saveText = async () => {
    if (pending) {
      setError(
        t(
          loginSwitch.isPending
            ? `${COPY_KEY}.confirmSwitchFirst`
            : `${STEP_COPY_KEY}.saveErrors.restrictionsParsing`,
        ),
      )
      return false
    }
    const trimmed = esrvcId.trim()
    if (
      !isValidEsrvcId(esrvcId) ||
      authType !== FormAuthType.CP ||
      trimmed === savedEsrvcId
    ) {
      discardEsrvcIdDraft()
      return true
    }
    return saveLogin({ authType, deletedIds: [], unassignedIds: [] }, trimmed)
  }
  const restrictions = createStepOneLoginRestrictionsDraft(settings)
  const saveRestrictions = (patch: Partial<StepOneLoginRestrictionsDraft>) =>
    void persist((formId) =>
      saveStepOneLoginRestrictions(
        formId,
        { isSingleSubmission: settings.isSingleSubmission },
        { ...restrictions, ...patch },
      ),
    )
  const latestActions = {
    saveText,
    selectProvider: loginSwitch.requestSwitch,
    saveRestrictions,
  }
  const latestActionsRef = useRef(latestActions)
  latestActionsRef.current = latestActions
  const afterSave = (run: () => void) =>
    queueAfterSave ? queueAfterSave(run) : run()
  const dirty = pending || esrvcId !== savedEsrvcId
  useEffect(() => {
    registerDraft(step._id, {
      dirty,
      pending,
      save: () => latestActionsRef.current.saveText(),
    })
    return () => registerDraft(step._id, null)
  }, [registerDraft, step._id, dirty, pending])

  const controlsDisabled =
    isPublic || isParsing || (isDisabled && !queueAfterSave)
  return (
    <Stack
      as="fieldset"
      disabled={controlsDisabled}
      border="0"
      m="0"
      minW="0"
      spacing="1.5rem"
      px="2rem"
      pb="2rem"
    >
      <AuthSwitchConfirmation {...loginSwitch.confirmationProps} />
      <StepLoginControls
        isHeading
        commitOnActivation
        idPrefix={`settings-step-${stepIndex}-login`}
        authType={authType}
        savedAuthType={authType}
        esrvcId={esrvcId}
        onAuthTypeChange={(next) =>
          afterSave(() => latestActionsRef.current.selectProvider(next))
        }
        isProviderDisabled={controlsDisabled}
        onEsrvcIdChange={(value) => {
          setEsrvcId(value)
          setError('')
        }}
        onEsrvcIdCommit={() => {
          void saveText()
        }}
        isDisabled={disabled || isParsing}
        disabledReason={isPublic ? t(`${COPY_KEY}.closeFormToEdit`) : undefined}
      />
      {stepIndex === 0 && authType !== FormAuthType.NIL ? (
        <StepOneLoginRestrictions
          settings={settings}
          authType={authType}
          value={restrictions}
          onChange={(patch) =>
            afterSave(() => latestActionsRef.current.saveRestrictions(patch))
          }
          isDisabled={controlsDisabled}
          onParsingChange={setIsParsing}
          dividerBleed="2rem"
        />
      ) : null}
      {error ? (
        <InlineMessage variant="error">
          <Text role="alert">{error}</Text>
        </InlineMessage>
      ) : null}
    </Stack>
  )
}
