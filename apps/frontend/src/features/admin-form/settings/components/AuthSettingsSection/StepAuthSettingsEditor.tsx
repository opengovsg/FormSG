import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import { Box, Stack, Text } from '@chakra-ui/react'

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

import { adminFormKeys } from '~features/admin-form/common/queries'
import { SaveActionGroup } from '~features/admin-form/create/logic/components/LogicContent/EditLogicBlock/EditCondition'
import { updateWorkflowStep } from '~features/admin-form/create/workflow/FormWorkflowService'
import { useStepLoginSwitch } from '~features/admin-form/create/workflow/hooks/useStepLoginSwitch'

import { adminFormSettingsKeys } from '../../queries'
import { isValidEsrvcId } from '../../utils'

import { AuthSwitchConfirmation } from './AuthSwitchConfirmation'
import { StepLoginControls } from './StepLoginControls'
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

/**
 * The editor exists only while its card is open, so Cancel discards all
 * drafts. A save is checked against the form as it was when the card opened:
 * the server refuses it if the form changed since.
 */
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
  const [authType, setAuthType] = useState<FormAuthType>(
    getStepAuthType(settings, form.workflow, stepIndex),
  )
  const [esrvcId, setEsrvcId] = useState(
    getStepEsrvcId(settings, form.workflow, stepIndex) ?? '',
  )
  const [baseline] = useState(settings)
  const [draftFieldIds, setDraftFieldIds] = useState(step.edit)
  const [restrictions, setRestrictions] = useState(() =>
    createStepOneLoginRestrictionsDraft(settings),
  )
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState('')
  const [deletedFieldIds, setDeletedFieldIds] = useState<string[]>([])
  const isPublic = form.status === FormStatus.Public

  const saveMutation = useMutation(
    async () => {
      if (!formId) throw new Error('No formId provided')
      const trimmedEsrvcId = esrvcId.trim()
      const corppassId =
        authType === FormAuthType.CP && trimmedEsrvcId
          ? { esrvc_id: trimmedEsrvcId }
          : {}
      const confirmation = {
        delete_auth_field_ids: deletedFieldIds,
        expected_last_modified: form.lastModified,
      }
      let loginSaved = false
      try {
        await updateWorkflowStep(
          formId,
          stepIndex,
          stepIndex === 0
            ? {
                ...confirmation,
                _id: step._id,
                workflow_type: WorkflowType.Static,
                emails: [],
                edit: draftFieldIds,
                step_name: step.step_name,
                approval_field: step.approval_field,
                is_approval_enabled: step.is_approval_enabled,
                first_step_login: isStepLoginAuthType(authType)
                  ? {
                      auth_type: authType,
                      // Sent even when cleared, so the form-level ID is saved
                      ...(authType === FormAuthType.CP
                        ? { esrvc_id: trimmedEsrvcId }
                        : {}),
                    }
                  : undefined,
              }
            : {
                ...step,
                ...confirmation,
                edit: draftFieldIds,
                // null removes the login. Leaving auth out keeps it.
                auth: !isWorkflowStepAuthType(authType)
                  ? null
                  : authType === FormAuthType.CP
                    ? { auth_type: authType, ...corppassId }
                    : { auth_type: authType },
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
  const loginSwitch = useStepLoginSwitch({
    form,
    stepNumber: stepIndex,
    authType,
    assignedIds: draftFieldIds,
    isDisabled: isPublic || isLoading,
    onSwitch: ({ authType: next, unassignedIds, deletedIds }) => {
      const unassigned = new Set(unassignedIds)
      setDraftFieldIds((ids) => ids.filter((id) => !unassigned.has(id)))
      setDeletedFieldIds(deletedIds)
      setAuthType(next)
      setError('')
      onDirtyChange(true)
    },
  })
  const changeRestrictions = (
    patch: Partial<StepOneLoginRestrictionsDraft>,
  ) => {
    setRestrictions((current) => ({ ...current, ...patch }))
    onDirtyChange(true)
    setError('')
  }

  const isSaveBlocked =
    isPublic ||
    isParsing ||
    (authType === FormAuthType.CP && !isValidEsrvcId(esrvcId))
  const inFlightSave = useRef<Promise<boolean> | null>(null)
  const save = async (): Promise<boolean> => {
    if (inFlightSave.current) return inFlightSave.current
    if (loginSwitch.isPending) {
      setError(
        'Confirm or cancel the authentication change before leaving this card.',
      )
      return false
    }
    if (isSaveBlocked) {
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
      <AuthSwitchConfirmation {...loginSwitch.confirmationProps} />
      <Stack spacing="1.5rem" px="2rem">
        <StepLoginControls
          isTitleToggle
          idPrefix={`settings-step-${stepIndex}-login`}
          authType={authType}
          esrvcId={esrvcId}
          onAuthTypeChange={(next) => loginSwitch.requestSwitch(next)}
          onEsrvcIdChange={(value) => {
            setEsrvcId(value)
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
            authType={authType}
            value={restrictions}
            onChange={changeRestrictions}
            isDisabled={isPublic || isLoading}
            onParsingChange={setIsParsing}
            dividerBleed="2rem"
          />
        ) : null}
        {draftFieldIds.length < step.edit.length ? (
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
          isSubmitDisabled={isSaveBlocked}
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
