import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

import { SaveActionGroup } from '~features/admin-form/create/logic/components/LogicContent/EditLogicBlock/EditCondition'
import { updateWorkflowStep } from '~features/admin-form/create/workflow/FormWorkflowService'
import { useStepLoginSwitch } from '~features/admin-form/create/workflow/hooks/useStepLoginSwitch'
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
  const { t } = useTranslation()
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
      if (!formId)
        throw new Error(
          t('features.adminForm.settings.mutations.missingFormId'),
        )
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
                ...normaliseFirstStepLogin(
                  isStepLoginAuthType(authType)
                    ? { auth_type: authType, esrvc_id: esrvcId }
                    : undefined,
                ),
              }
            : {
                ...step,
                ...confirmation,
                edit: draftFieldIds,
                auth: normaliseStepAuth(
                  isWorkflowStepAuthType(authType)
                    ? { auth_type: authType, esrvc_id: esrvcId }
                    : null,
                ),
              },
        )
        loginSaved = true
        if (stepIndex === 0 && authType !== FormAuthType.NIL)
          await saveStepOneLoginRestrictions(formId, baseline, restrictions)
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : t(`${COPY_KEY}.saveFailed`)
        throw new Error(
          loginSaved
            ? t(`${COPY_KEY}.restrictionsFailed`, { message })
            : message,
        )
      } finally {
        await invalidateLoginQueries(queryClient, formId)
      }
    },
    {
      onSuccess: () => {
        toast({ description: t(`${COPY_KEY}.saved`) })
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
      setError(t(`${COPY_KEY}.confirmSwitchFirst`))
      return false
    }
    if (isSaveBlocked) {
      setError(
        isParsing
          ? t(`${STEP_COPY_KEY}.saveErrors.restrictionsParsing`)
          : t(`${COPY_KEY}.checkBeforeSaving`),
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
          notice={isPublic ? t(`${COPY_KEY}.closeFormToEdit`) : undefined}
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
              ? t(`${COPY_KEY}.deleteNotice`)
              : t(`${COPY_KEY}.unassignNotice`)}
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
          submitButtonLabel={t('features.common.save')}
          ariaLabelName={t(`${COPY_KEY}.ariaLabelName`)}
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
