import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Text } from '@chakra-ui/react'

import {
  AdminMultirespondentFormDto,
  FormAuthType,
  FormStatus,
  FormWorkflowStepAuth,
  FormWorkflowStepDto,
  StepLoginAuthType,
} from 'formsg-shared/types'
import { getStepFieldsNeedingLogin } from 'formsg-shared/utils/step-login'

import { ADMINFORM_ROUTE } from '~constants/routes'
import Link from '~components/Link'

import { OPEN_WORKFLOW_TAB_STATE } from '~features/admin-form/create/common/OpenWorkflowTabOnArrival'
import { useAdminWorkflowStore } from '~features/admin-form/create/workflow/adminWorkflowStore'
import { normaliseStepAuth } from '~features/admin-form/create/workflow/components/WorkflowContent/EditStepBlock/EditStepBlock'
import { useWorkflowMutations } from '~features/admin-form/create/workflow/mutations'

import { hasEsrvcIdWhitespace, StepLoginControls } from './StepLoginControls'

const COPY_KEY = 'features.adminForm.settings.singpass.stepLogin'

interface LaterStepAuthSettingsProps {
  form: AdminMultirespondentFormDto
  step: FormWorkflowStepDto
  // Zero-indexed
  stepIndex: number
}

/**
 * Login settings for a step after Step 1, saved straight onto the step as
 * the form-level controls save onto the form. A change the step's Myinfo
 * fields would break is refused here and by the server; the admin removes
 * those fields in the workflow editor first.
 */
export const LaterStepAuthSettings = ({
  form,
  step,
  stepIndex,
}: LaterStepAuthSettingsProps): JSX.Element => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const navigate = useNavigate()
  const { updateStepMutation } = useWorkflowMutations()

  const savedAuth = step.auth
  const [esrvcIdDraft, setEsrvcIdDraft] = useState(savedAuth?.esrvc_id ?? '')
  const [hasBlockedChange, setHasBlockedChange] = useState(false)

  const isFormPublic = form.status === FormStatus.Public
  const isLoading = updateStepMutation.isLoading

  const save = useCallback(
    (auth: FormWorkflowStepAuth | undefined) => {
      updateStepMutation.mutate(
        {
          stepNumber: stepIndex,
          updateStepBody: { ...step, auth: normaliseStepAuth(auth) },
        },
        {
          onSuccess: () => setHasBlockedChange(false),
          // The toast carries the server's message; the inline link shows
          // where to fix it.
          onError: () => setHasBlockedChange(true),
        },
      )
    },
    [step, stepIndex, updateStepMutation],
  )

  const handleAuthTypeChange = (next: StepLoginAuthType) => {
    if (isLoading || next === (savedAuth?.auth_type ?? FormAuthType.NIL)) {
      return
    }
    const stepFields = form.form_fields.filter((field) =>
      step.edit.includes(field._id),
    )
    if (getStepFieldsNeedingLogin(stepFields, next).length > 0) {
      setHasBlockedChange(true)
      return
    }
    setHasBlockedChange(false)
    save(
      next === FormAuthType.NIL
        ? undefined
        : { auth_type: next, esrvc_id: esrvcIdDraft },
    )
  }

  const handleEsrvcIdBlur = () => {
    if (!savedAuth || savedAuth.auth_type !== FormAuthType.CP) return
    const trimmed = esrvcIdDraft.trim()
    if (hasEsrvcIdWhitespace(trimmed)) {
      setEsrvcIdDraft(savedAuth.esrvc_id ?? '')
      return
    }
    if (trimmed === (savedAuth.esrvc_id ?? '')) return
    save({ auth_type: FormAuthType.CP, esrvc_id: trimmed })
  }

  // Opens the workflow editor on this step so the fields can be removed.
  const handleEditStep = () => {
    useAdminWorkflowStore.getState().setToEditing(stepIndex)
    navigate(`${ADMINFORM_ROUTE}/${formId}`, { state: OPEN_WORKFLOW_TAB_STATE })
  }

  return (
    <StepLoginControls
      idPrefix={`settings-step-${stepIndex}-login`}
      authType={savedAuth?.auth_type ?? FormAuthType.NIL}
      esrvcId={esrvcIdDraft}
      onAuthTypeChange={handleAuthTypeChange}
      onEsrvcIdChange={setEsrvcIdDraft}
      onEsrvcIdBlur={handleEsrvcIdBlur}
      isDisabled={isFormPublic}
      isLoading={isLoading}
      isEsrvcIdLoading={isLoading}
      errorMessage={
        hasBlockedChange ? (
          <Text>
            {t(`${COPY_KEY}.removeFieldsFirst`)}{' '}
            <Link as="button" type="button" onClick={handleEditStep}>
              {t(`${COPY_KEY}.editStep`)}
            </Link>
          </Text>
        ) : undefined
      }
    />
  )
}
