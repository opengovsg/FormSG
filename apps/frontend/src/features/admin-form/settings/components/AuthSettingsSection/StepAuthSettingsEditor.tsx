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
  runSave: (id: string, action: () => Promise<void>) => Promise<boolean>
}

/** Saves one control at a time against the current, reviewed form snapshot. */
export const StepAuthSettingsEditor = ({
  form,
  settings,
  step,
  stepIndex,
  isDisabled,
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
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState('')
  const isPublic = form.status === FormStatus.Public
  const disabled = isPublic || isDisabled
  useEffect(() => setEsrvcId(savedEsrvcId), [savedEsrvcId])

  const persist = (action: () => Promise<void>) => {
    if (disabled || !formId) return Promise.resolve(false)
    return runSave(step._id, async () => {
      setError('')
      try {
        await action()
        toast({ description: t(`${COPY_KEY}.saved`) })
      } catch (cause) {
        setEsrvcId(savedEsrvcId)
        setError(
          cause instanceof Error ? cause.message : t(`${COPY_KEY}.saveFailed`),
        )
        throw cause
      } finally {
        await invalidateLoginQueries(queryClient, formId)
      }
    })
  }
  const saveLogin = (change: StepLoginSwitch, nextEsrvcId: string) =>
    persist(async () => {
      const unassigned = new Set(change.unassignedIds)
      const common = {
        delete_auth_field_ids: change.deletedIds,
        expected_last_modified: form.lastModified,
        edit: step.edit.filter((id) => !unassigned.has(id)),
      }
      await updateWorkflowStep(
        formId!,
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
    })
  const loginSwitch = useStepLoginSwitch({
    form,
    stepNumber: stepIndex,
    authType,
    assignedIds: step.edit,
    isDisabled: disabled || isParsing,
    onSwitch: (change) => {
      // A provider change saves only that choice, never an unfinished text draft.
      setEsrvcId(savedEsrvcId)
      void saveLogin(change, savedEsrvcId)
    },
  })
  const saveText = async () => {
    if (loginSwitch.isPending || isParsing) {
      setError(
        t(
          loginSwitch.isPending
            ? `${COPY_KEY}.confirmSwitchFirst`
            : `${STEP_COPY_KEY}.saveErrors.restrictionsParsing`,
        ),
      )
      return false
    }
    if (!isValidEsrvcId(esrvcId)) {
      setEsrvcId(savedEsrvcId)
      return true
    }
    const trimmed = esrvcId.trim()
    if (authType !== FormAuthType.CP || trimmed === savedEsrvcId) {
      setEsrvcId(savedEsrvcId)
      return true
    }
    return saveLogin({ authType, deletedIds: [], unassignedIds: [] }, trimmed)
  }
  const saveRef = useRef(saveText)
  saveRef.current = saveText
  const dirty = esrvcId !== savedEsrvcId || loginSwitch.isPending || isParsing
  useEffect(() => {
    registerDraft(step._id, {
      dirty,
      pending: loginSwitch.isPending || isParsing,
      save: () => saveRef.current(),
    })
    return () => registerDraft(step._id, null)
  }, [registerDraft, step._id, dirty, loginSwitch.isPending, isParsing])

  const restrictions = createStepOneLoginRestrictionsDraft(settings)
  const changeRestrictions = (
    patch: Partial<StepOneLoginRestrictionsDraft>,
  ) => {
    void persist(() =>
      saveStepOneLoginRestrictions(
        formId!,
        { isSingleSubmission: settings.isSingleSubmission },
        { ...restrictions, ...patch },
      ),
    )
  }
  return (
    <Stack
      as="fieldset"
      disabled={disabled || isParsing}
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
        onAuthTypeChange={loginSwitch.requestSwitch}
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
          onChange={changeRestrictions}
          isDisabled={disabled || isParsing}
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
