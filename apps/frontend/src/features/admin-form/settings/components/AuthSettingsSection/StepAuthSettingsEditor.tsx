import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import { HStack, Stack, Text } from '@chakra-ui/react'
import isEqual from 'lodash/isEqual'

import {
  AdminMultirespondentFormDto,
  FormAuthType,
  FormStatus,
  FormWorkflowStepDto,
  MultirespondentFormSettings,
  StepLoginAuthType,
  WorkflowType,
} from 'formsg-shared/types'
import {
  getStepAuthType,
  getStepFields,
  getStepFieldsNeedingLogin,
} from 'formsg-shared/utils/step-login'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import { getAdminFormView } from '~features/admin-form/common/AdminViewFormService'
import { adminFormKeys } from '~features/admin-form/common/queries'
import { updateWorkflowStep } from '~features/admin-form/create/workflow/FormWorkflowService'

import { adminFormSettingsKeys } from '../../queries'

import { hasEsrvcIdWhitespace, StepLoginControls } from './StepLoginControls'
import {
  createStepOneLoginRestrictionsDraft,
  saveStepOneLoginRestrictions,
  StepOneLoginRestrictions,
  StepOneLoginRestrictionsDraft,
} from './StepOneLoginRestrictions'

interface StepAuthSettingsEditorProps {
  form: AdminMultirespondentFormDto
  settings: MultirespondentFormSettings
  step: FormWorkflowStepDto
  stepIndex: number
  onClose: () => void
  onDirtyChange: (dirty: boolean) => void
  onSavingChange: (saving: boolean) => void
}

/** The editor exists only while its card is open, so Cancel discards all drafts. */
export const StepAuthSettingsEditor = ({
  form,
  settings,
  step,
  stepIndex,
  onClose,
  onDirtyChange,
  onSavingChange,
}: StepAuthSettingsEditorProps): JSX.Element => {
  const { formId } = useParams()
  const queryClient = useQueryClient()
  const originalAuth = getStepAuthType(settings, form.workflow, stepIndex)
  const [authType, setAuthType] = useState<StepLoginAuthType>(
    originalAuth === FormAuthType.SP ? FormAuthType.MyInfo : originalAuth,
  )
  const [esrvcId, setEsrvcId] = useState(
    stepIndex === 0 ? (settings.esrvcId ?? '') : (step.auth?.esrvc_id ?? ''),
  )
  const [baseline] = useState(settings)
  const [baselineStep] = useState(step)
  const [restrictions, setRestrictions] = useState(() =>
    createStepOneLoginRestrictionsDraft(settings),
  )
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState('')
  const [hasLoginChanges, setHasLoginChanges] = useState(false)
  const isPublic = form.status === FormStatus.Public

  const saveMutation = useMutation(
    async () => {
      if (!formId) throw new Error('No formId provided')
      const latest = await getAdminFormView(formId)
      queryClient.setQueryData(adminFormKeys.id(formId), latest)
      if (latest.responseMode !== form.responseMode || !('workflow' in latest))
        throw new Error('This form has changed. Reload Settings before saving.')
      if (latest.status === FormStatus.Public)
        throw new Error(
          'Close your form before changing authentication settings.',
        )
      const latestStep = latest.workflow[stepIndex]
      if (
        !latestStep ||
        !isEqual(latestStep, baselineStep) ||
        (stepIndex === 0 &&
          (latest.authType !== baseline.authType ||
            latest.esrvcId !== baseline.esrvcId ||
            !!latest.isSingleSubmission !== !!baseline.isSingleSubmission))
      ) {
        await queryClient.invalidateQueries(adminFormSettingsKeys.id(formId))
        throw new Error(
          'This step has changed since you opened it. Cancel and reopen the card to review the latest settings.',
        )
      }
      const fields = getStepFields(
        latest.form_fields,
        latest.workflow,
        stepIndex,
      )
      const incompatible = getStepFieldsNeedingLogin(fields, authType)
      if (incompatible.length > 0)
        throw new Error(
          'Unassign the fields that require the current login in Create → Workflow before changing it.',
        )
      let loginSaved = false
      try {
        await updateWorkflowStep(
          formId,
          stepIndex,
          stepIndex === 0
            ? {
                _id: latestStep._id,
                workflow_type: WorkflowType.Static,
                emails: [],
                edit: latestStep.edit,
                step_name: latestStep.step_name,
                approval_field: latestStep.approval_field,
                is_approval_enabled: latestStep.is_approval_enabled,
                first_step_login:
                  originalAuth === FormAuthType.SP && !hasLoginChanges
                    ? undefined
                    : {
                        auth_type: authType,
                        ...(authType === FormAuthType.CP
                          ? { esrvc_id: esrvcId.trim() }
                          : {}),
                      },
              }
            : {
                ...latestStep,
                auth:
                  authType === FormAuthType.NIL
                    ? undefined
                    : {
                        auth_type: authType,
                        ...(authType === FormAuthType.CP && esrvcId.trim()
                          ? { esrvc_id: esrvcId.trim() }
                          : {}),
                      },
              },
        )
        loginSaved = true
        if (stepIndex === 0 && authType !== FormAuthType.NIL)
          await saveStepOneLoginRestrictions(formId, baseline, restrictions)
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : 'Unable to save settings.'
        throw new Error(
          loginSaved
            ? `The login was saved, but some Step 1 restrictions could not be saved. ${message} Review the saved settings before trying again.`
            : message,
        )
      } finally {
        await Promise.all([
          queryClient.invalidateQueries(adminFormKeys.id(formId)),
          queryClient.invalidateQueries(adminFormSettingsKeys.id(formId)),
          queryClient.invalidateQueries(
            adminFormSettingsKeys.whitelist(formId),
          ),
        ])
      }
    },
    {
      onSuccess: () => {
        onDirtyChange(false)
        onClose()
      },
      onError: (cause: Error) => setError(cause.message),
      onSettled: () => onSavingChange(false),
    },
  )
  const isLoading = saveMutation.isLoading
  const changeAuth = (next: StepLoginAuthType) => {
    const incompatible = getStepFieldsNeedingLogin(
      getStepFields(form.form_fields, form.workflow, stepIndex),
      next,
    )
    if (incompatible.length) {
      setError(
        `This login is required by: ${incompatible.map((field) => field.title).join(', ')}. Unassign these fields in Create → Workflow before changing the login.`,
      )
      return
    }
    setError('')
    setAuthType(next)
    setHasLoginChanges(true)
    onDirtyChange(true)
  }
  const changeRestrictions = (
    patch: Partial<StepOneLoginRestrictionsDraft>,
  ) => {
    setRestrictions((current) => ({ ...current, ...patch }))
    onDirtyChange(true)
    setError('')
  }

  return (
    <Stack spacing="1.5rem">
      <StepLoginControls
        idPrefix={`settings-step-${stepIndex}-login`}
        authType={authType}
        esrvcId={esrvcId}
        onAuthTypeChange={changeAuth}
        onEsrvcIdChange={(value) => {
          setEsrvcId(value)
          setHasLoginChanges(true)
          onDirtyChange(true)
          setError('')
        }}
        isDisabled={isPublic || isLoading}
        isLoading={isLoading}
        notice={
          isPublic
            ? 'Close your form to change authentication settings.'
            : undefined
        }
      />
      {stepIndex === 0 && authType !== FormAuthType.NIL ? (
        <StepOneLoginRestrictions
          settings={settings}
          value={restrictions}
          onChange={changeRestrictions}
          isDisabled={isPublic || isLoading}
          onParsingChange={setIsParsing}
        />
      ) : null}
      {error ? (
        <InlineMessage variant="error">
          <Text role="alert">{error}</Text>
        </InlineMessage>
      ) : null}
      <HStack
        spacing="1rem"
        pt="1rem"
        borderTopWidth="1px"
        borderColor="neutral.300"
      >
        <Button
          isLoading={isLoading}
          isDisabled={
            isPublic ||
            isParsing ||
            (authType === FormAuthType.CP && hasEsrvcIdWhitespace(esrvcId))
          }
          onClick={() => {
            setError('')
            onSavingChange(true)
            saveMutation.mutate()
          }}
        >
          Save
        </Button>
        <Button
          variant="clear"
          isDisabled={isLoading}
          onClick={() => {
            onDirtyChange(false)
            onClose()
          }}
        >
          Cancel
        </Button>
      </HStack>
    </Stack>
  )
}
