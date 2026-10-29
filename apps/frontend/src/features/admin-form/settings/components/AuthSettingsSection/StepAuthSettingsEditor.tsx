import { useEffect, useRef, useState } from 'react'
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

import { useToast } from '~hooks/useToast'
import InlineMessage from '~components/InlineMessage'

import { getAdminFormView } from '~features/admin-form/common/AdminViewFormService'
import { adminFormKeys } from '~features/admin-form/common/queries'
import { SaveActionGroup } from '~features/admin-form/create/logic/components/LogicContent/EditLogicBlock/EditCondition'
import { updateWorkflowStep } from '~features/admin-form/create/workflow/FormWorkflowService'
import {
  getAffectedAuthFieldRules,
  getAuthSwitchConsequences,
} from '~features/admin-form/create/workflow/utils/authFieldRemoval'

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
  onSaveReady?: (save: (() => Promise<boolean>) | null) => void
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
  onSaveReady,
}: StepAuthSettingsEditorProps): JSX.Element => {
  const { formId } = useParams()
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })
  const originalAuth = getStepAuthType(settings, form.workflow, stepIndex)
  const [authType, setAuthType] = useState<StepLoginAuthType>(
    originalAuth === FormAuthType.SP ? FormAuthType.MyInfo : originalAuth,
  )
  const [esrvcId, setEsrvcId] = useState(
    stepIndex === 0 ? (settings.esrvcId ?? '') : (step.auth?.esrvc_id ?? ''),
  )
  const [baseline] = useState(settings)
  const [baselineStep] = useState(step)
  const [baselineForm] = useState(form)
  const [draftFieldIds, setDraftFieldIds] = useState(step.edit)
  const [pendingAuthType, setPendingAuthType] = useState<StepLoginAuthType>()
  const [restrictions, setRestrictions] = useState(() =>
    createStepOneLoginRestrictionsDraft(settings),
  )
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState('')
  const [deletedFieldIds, setDeletedFieldIds] = useState<string[]>([])
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
      if (
        deletedFieldIds.length &&
        (!isEqual(latest.form_fields, baselineForm.form_fields) ||
          !isEqual(latest.form_logics, baselineForm.form_logics) ||
          !isEqual(latest.workflow, baselineForm.workflow) ||
          latest.authType !== baselineForm.authType ||
          latest.esrvcId !== baselineForm.esrvcId)
      )
        throw new Error(
          'This form changed after you reviewed the fields to delete. Cancel and reopen the card to review the latest changes.',
        )
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
                delete_auth_field_ids: deletedFieldIds,
                expected_last_modified: baselineForm.lastModified,
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
                delete_auth_field_ids: deletedFieldIds,
                expected_last_modified: baselineForm.lastModified,
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
        toast({ description: 'Authentication settings saved.' })
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
  const consequences =
    pendingAuthType === undefined
      ? { deletedFields: [], unassignedFields: [] }
      : getAuthSwitchConsequences(
          form,
          stepIndex,
          pendingAuthType,
          draftFieldIds,
        )
  const isDeletingFields = consequences.deletedFields.length > 0
  const pendingFields = isDeletingFields
    ? consequences.deletedFields
    : consequences.unassignedFields
  const changeAuth = (next: StepLoginAuthType) => {
    if (isPublic || isLoading || next === authType) return
    const proposed = getAuthSwitchConsequences(
      form,
      stepIndex,
      next,
      draftFieldIds,
    )
    if (proposed.deletedFields.length || proposed.unassignedFields.length) {
      setPendingAuthType(next)
      return
    }
    setDeletedFieldIds([])
    applyAuth(next)
  }
  const confirmSwitch = () => {
    if (pendingAuthType === undefined || isPublic || isLoading) return
    const incompatibleIds = new Set(
      consequences.unassignedFields.map((field) => field._id),
    )
    setDraftFieldIds((ids) => ids.filter((id) => !incompatibleIds.has(id)))
    setDeletedFieldIds(consequences.deletedFields.map((field) => field._id))
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

  const inFlightSave = useRef<Promise<boolean> | null>(null)
  const save = async (): Promise<boolean> => {
    if (inFlightSave.current) return inFlightSave.current
    if (pendingAuthType !== undefined) {
      setError(
        'Confirm or cancel the authentication change before leaving this card.',
      )
      return false
    }
    if (
      isPublic ||
      isParsing ||
      (authType === FormAuthType.CP && hasEsrvcIdWhitespace(esrvcId))
    ) {
      setError(
        isParsing
          ? 'Wait for the eligible respondent list to finish checking.'
          : 'Check the authentication settings before saving.',
      )
      return false
    }
    setError('')
    onSavingChange(true)
    const request = saveMutation
      .mutateAsync()
      .then(() => true)
      .catch(() => false)
    inFlightSave.current = request
    try {
      return await request
    } finally {
      inFlightSave.current = null
    }
  }
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => {
    onSaveReady?.(() => saveRef.current())
    return () => onSaveReady?.(null)
  }, [onSaveReady])

  return (
    <Stack spacing="0">
      <AuthSwitchConfirmation
        currentAuthType={authType}
        nextAuthType={pendingAuthType}
        fields={pendingFields}
        deleteFields={isDeletingFields}
        affectedRules={getAffectedAuthFieldRules(
          form,
          consequences.deletedFields.map((field) => field._id),
        )}
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
            {deletedFieldIds.length
              ? 'Confirmed fields will be deleted from the form when you save or navigate away.'
              : 'Incompatible fields will be unassigned when you save or navigate away. They remain in the form.'}
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
            void save()
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
