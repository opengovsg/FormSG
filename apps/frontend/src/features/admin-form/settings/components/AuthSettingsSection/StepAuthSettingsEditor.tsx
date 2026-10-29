import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import { Box, Stack, Text } from '@chakra-ui/react'
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
  getStepFieldsNeedingLogin,
} from 'formsg-shared/utils/step-login'

import InlineMessage from '~components/InlineMessage'

import { getAdminFormView } from '~features/admin-form/common/AdminViewFormService'
import { adminFormKeys } from '~features/admin-form/common/queries'
import { SaveActionGroup } from '~features/admin-form/create/logic/components/LogicContent/EditLogicBlock/EditCondition'
import { updateWorkflowStep } from '~features/admin-form/create/workflow/FormWorkflowService'

import { adminFormSettingsKeys } from '../../queries'

import { AuthSwitchConfirmation } from './AuthSwitchConfirmation'
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
  const [draftFieldIds, setDraftFieldIds] = useState(step.edit)
  const [pendingAuthType, setPendingAuthType] = useState<StepLoginAuthType>()
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
      const fields = latest.form_fields.filter((field) =>
        draftFieldIds.includes(field._id),
      )
      const incompatible = getStepFieldsNeedingLogin(fields, authType)
      if (incompatible.length > 0)
        throw new Error(
          'These fields changed while you were editing. Cancel and reopen the card to review their authentication requirements.',
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
                edit: draftFieldIds,
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
                edit: draftFieldIds,
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
  const applyAuth = (next: StepLoginAuthType) => {
    setError('')
    setAuthType(next)
    setHasLoginChanges(true)
    onDirtyChange(true)
  }
  const pendingFields =
    pendingAuthType === undefined
      ? []
      : getStepFieldsNeedingLogin(
          form.form_fields.filter((field) => draftFieldIds.includes(field._id)),
          pendingAuthType,
        )
  const changeAuth = (next: StepLoginAuthType) => {
    if (isPublic || isLoading || next === authType) return
    const incompatible = getStepFieldsNeedingLogin(
      form.form_fields.filter((field) => draftFieldIds.includes(field._id)),
      next,
    )
    if (incompatible.length) {
      setPendingAuthType(next)
      return
    }
    applyAuth(next)
  }
  const confirmSwitch = () => {
    if (pendingAuthType === undefined || isPublic || isLoading) return
    const incompatibleIds = new Set(pendingFields.map((field) => field._id))
    setDraftFieldIds((ids) => ids.filter((id) => !incompatibleIds.has(id)))
    applyAuth(pendingAuthType)
    setPendingAuthType(undefined)
  }
  const changeRestrictions = (
    patch: Partial<StepOneLoginRestrictionsDraft>,
  ) => {
    setRestrictions((current) => ({ ...current, ...patch }))
    onDirtyChange(true)
    setError('')
  }

  return (
    <Stack spacing="0">
      <AuthSwitchConfirmation
        currentAuthType={authType}
        nextAuthType={pendingAuthType}
        fields={pendingFields}
        onClose={() => setPendingAuthType(undefined)}
        onConfirm={confirmSwitch}
      />
      <Stack spacing="1.5rem" px="2rem">
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
            dividerBleed="2rem"
          />
        ) : null}
        {draftFieldIds.length < baselineStep.edit.length ? (
          <Text textStyle="body-2" color="secondary.400">
            Incompatible fields will be unassigned when you save. Assign them to
            a matching step or delete them before publishing.
          </Text>
        ) : null}
        {error ? (
          <InlineMessage variant="error">
            <Text role="alert">{error}</Text>
          </InlineMessage>
        ) : null}
      </Stack>
      <Box mt="1.5rem" py="2rem" borderTopWidth="1px" borderColor="neutral.300">
        <SaveActionGroup
          submitButtonLabel="Save"
          ariaLabelName="authentication settings"
          isLoading={isLoading}
          isSubmitDisabled={
            isPublic ||
            isParsing ||
            (authType === FormAuthType.CP && hasEsrvcIdWhitespace(esrvcId))
          }
          handleSubmit={() => {
            setError('')
            onSavingChange(true)
            saveMutation.mutate()
          }}
          handleCancel={() => {
            onDirtyChange(false)
            onClose()
          }}
        />
      </Box>
    </Stack>
  )
}
