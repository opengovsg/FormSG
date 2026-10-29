import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Text } from '@chakra-ui/react'

import {
  FirstStepLoginInput,
  FormAuthType,
  FormResponseMode,
  FormStatus,
  MultirespondentFormSettings,
  StepLoginAuthType,
} from 'formsg-shared/types'
import { getStepFieldsNeedingLogin } from 'formsg-shared/utils/step-login'

import { textStyles } from '~theme/textStyles'

import { useAdminForm } from '~features/admin-form/common/queries'
import { StepLoginControls } from '~features/admin-form/settings/components/AuthSettingsSection/StepLoginControls'
import {
  createStepOneLoginRestrictionsDraft,
  StepOneLoginRestrictions,
} from '~features/admin-form/settings/components/AuthSettingsSection/StepOneLoginRestrictions'
import { useAdminFormSettings } from '~features/admin-form/settings/queries'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { useIsWorkflowBuilderRedesign } from '../../../hooks/useIsWorkflowBuilderRedesign'
import { EditStepInputs } from '../../../types'
import { useIsSpotlightActiveSection } from '../../Spotlight'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { FIELDS_TO_EDIT_NAME } from './EditStepBlock'
import { EditStepBlockContainer } from './EditStepBlockContainer'

const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin'

interface LoginBlockProps {
  formMethods: UseFormReturn<EditStepInputs>
  stepNumber: number
  isLoading: boolean
}

// Step 1 falls back to the form-level login
type ShownLogin = { auth_type: FormAuthType; esrvc_id?: string }

/**
 * A step's login, saved with the step. Step 1 edits the form-level login
 * through `first_step_login`; later steps stage their own `auth`. A change
 * the step's picked Myinfo fields would break is refused rather than
 * dropping the fields.
 */
export const LoginBlock = ({
  formMethods,
  stepNumber,
  isLoading,
}: LoginBlockProps): JSX.Element | null => {
  const { t } = useTranslation()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const isGuidedSection = useIsSpotlightActiveSection()
  const { data: form } = useAdminForm()
  const { formFields = [] } = useAdminFormWorkflow()
  const { watch, setValue } = formMethods
  const [blockedMessage, setBlockedMessage] = useState<string>()

  const isFirstStep = isFirstStepByStepNumber(stepNumber)
  const editedFirstStepLogin = watch('first_step_login')
  const editedAuth = watch('auth')
  const pickedFieldIds: string[] = watch(FIELDS_TO_EDIT_NAME) ?? []

  if (!form) return null

  const login: ShownLogin = isFirstStep
    ? (editedFirstStepLogin ?? {
        auth_type: form.authType,
        esrvc_id: form.esrvcId,
      })
    : (editedAuth ?? { auth_type: FormAuthType.NIL })

  const isFormPublic = form.status === FormStatus.Public

  const write = (next: FirstStepLoginInput) => {
    const value = {
      auth_type: next.auth_type,
      ...(next.auth_type === FormAuthType.CP && next.esrvc_id !== undefined
        ? { esrvc_id: next.esrvc_id }
        : {}),
    }
    if (isFirstStep) {
      setValue('first_step_login', value, { shouldDirty: true })
    } else {
      setValue(
        'auth',
        value.auth_type === FormAuthType.NIL
          ? null
          : { ...value, auth_type: value.auth_type },
        { shouldDirty: true },
      )
    }
  }

  const handleAuthTypeChange = (next: StepLoginAuthType) => {
    if (next === login.auth_type) return
    const stepFields = formFields.filter((field) =>
      pickedFieldIds.includes(field._id),
    )
    // The step's login-filled fields only work with a login that fills them.
    if (getStepFieldsNeedingLogin(stepFields, next).length > 0) {
      setBlockedMessage(t(`${COPY_KEY}.removeFieldsFirst`))
      return
    }
    setBlockedMessage(undefined)
    write({ auth_type: next, esrvc_id: login.esrvc_id })
  }

  return (
    <EditStepBlockContainer>
      {!isRedesign || isGuidedSection ? (
        <Text style={textStyles.h4}>{t(`${COPY_KEY}.title`)}</Text>
      ) : null}
      <StepLoginControls
        idPrefix={`step-${stepNumber}-login`}
        authType={login.auth_type}
        esrvcId={login.esrvc_id ?? ''}
        onAuthTypeChange={handleAuthTypeChange}
        // The e-service ID field only shows while Corppass is picked.
        onEsrvcIdChange={(esrvcId) =>
          write({ auth_type: FormAuthType.CP, esrvc_id: esrvcId })
        }
        isDisabled={isFormPublic}
        isLoading={isLoading}
        notice={isFormPublic ? t(`${COPY_KEY}.closeFormToEdit`) : undefined}
        errorMessage={blockedMessage}
      />
      {isFirstStep && login.auth_type !== FormAuthType.NIL ? (
        <WorkflowStepOneRestrictions
          formMethods={formMethods}
          isDisabled={isFormPublic || isLoading}
        />
      ) : null}
    </EditStepBlockContainer>
  )
}

const WorkflowStepOneRestrictions = ({
  formMethods,
  isDisabled,
}: {
  formMethods: UseFormReturn<EditStepInputs>
  isDisabled: boolean
}) => {
  const { data: settings } = useAdminFormSettings<MultirespondentFormSettings>()
  const draft = formMethods.watch('first_step_restrictions')
  if (!settings || settings.responseMode !== FormResponseMode.Multirespondent)
    return null
  return (
    <StepOneLoginRestrictions
      settings={settings}
      value={draft?.value ?? createStepOneLoginRestrictionsDraft(settings)}
      isDisabled={isDisabled}
      onParsingChange={(parsing) =>
        formMethods.setValue('first_step_restrictions_parsing', parsing)
      }
      onChange={(patch) =>
        formMethods.setValue(
          'first_step_restrictions',
          {
            baselineIsSingleSubmission:
              draft?.baselineIsSingleSubmission ??
              !!settings.isSingleSubmission,
            value: {
              ...(draft?.value ??
                createStepOneLoginRestrictionsDraft(settings)),
              ...patch,
            },
          },
          { shouldDirty: true },
        )
      }
    />
  )
}
