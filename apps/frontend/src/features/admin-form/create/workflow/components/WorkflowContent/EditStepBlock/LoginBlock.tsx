import { useEffect, useRef, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Text } from '@chakra-ui/react'

import {
  AdminMultirespondentFormDto,
  FormAuthType,
  FormResponseMode,
  FormStatus,
  MultirespondentFormSettings,
} from 'formsg-shared/types'

import { textStyles } from '~theme/textStyles'

import { useAdminForm } from '~features/admin-form/common/queries'
import { FieldListTabIndex } from '~features/admin-form/create/builder-and-design/constants'
import { useCreatePageSidebar } from '~features/admin-form/create/common'
import { AuthSwitchConfirmation } from '~features/admin-form/settings/components/AuthSettingsSection/AuthSwitchConfirmation'
import { StepLoginControls } from '~features/admin-form/settings/components/AuthSettingsSection/StepLoginControls'
import {
  createStepOneLoginRestrictionsDraft,
  StepOneLoginRestrictions,
} from '~features/admin-form/settings/components/AuthSettingsSection/StepOneLoginRestrictions'
import { useAdminFormSettings } from '~features/admin-form/settings/queries'

import { EditStepInputs } from '../../../types'
import { useIsSpotlightActiveSection } from '../../Spotlight'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { FIELDS_TO_EDIT_NAME } from './EditStepBlock'
import { EditStepBlockContainer } from './EditStepBlockContainer'
import { useStepEditorLogin } from './useStepEditorLogin'

const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin'

interface LoginBlockProps {
  formMethods: UseFormReturn<EditStepInputs>
  stepNumber: number
  isLoading: boolean
}

/**
 * A step's login, saved with the step. Step 1 edits the form-level login
 * through `first_step_login`; later steps stage their own `auth`. A provider
 * change asks to unassign incompatible fields in the same draft.
 */
export const LoginBlock = ({
  formMethods,
  stepNumber,
  isLoading,
}: LoginBlockProps): JSX.Element | null => {
  const { data: form } = useAdminForm()
  // The workflow tab is shown only on multi-respondent forms.
  if (!form || form.responseMode !== FormResponseMode.Multirespondent)
    return null
  return (
    <StepLogin
      form={form}
      formMethods={formMethods}
      stepNumber={stepNumber}
      isLoading={isLoading}
    />
  )
}

const StepLogin = ({
  form,
  formMethods,
  stepNumber,
  isLoading,
}: LoginBlockProps & { form: AdminMultirespondentFormDto }) => {
  const { t } = useTranslation()
  const isGuidedSection = useIsSpotlightActiveSection()
  const [hasUnassignedFields, setHasUnassignedFields] = useState(false)
  const isFormPublic = form.status === FormStatus.Public
  const { login, esrvcId, writeLogin, requestSwitch, confirmationProps } =
    useStepEditorLogin({
      form,
      formMethods,
      stepNumber,
      isDisabled: isFormPublic || isLoading,
      onSwitched: ({ unassignedIds }) =>
        setHasUnassignedFields(unassignedIds.length > 0),
    })

  return (
    <EditStepBlockContainer>
      <AuthSwitchConfirmation {...confirmationProps} />
      {isGuidedSection ? (
        <Text style={textStyles.h4}>{t(`${COPY_KEY}.title`)}</Text>
      ) : null}
      <StepLoginControls
        isTitleToggle={!isGuidedSection}
        idPrefix={`step-${stepNumber}-login`}
        authType={login.auth_type}
        esrvcId={esrvcId ?? ''}
        onAuthTypeChange={(next) => requestSwitch(next)}
        // The e-service ID field only shows while Corppass is picked.
        onEsrvcIdChange={(next) => writeLogin(FormAuthType.CP, next)}
        isDisabled={isFormPublic}
        isLoading={isLoading}
        notice={isFormPublic ? t(`${COPY_KEY}.closeFormToEdit`) : undefined}
      />
      {hasUnassignedFields ? (
        <Text textStyle="body-2" color="secondary.400">
          {t(`${COPY_KEY}.unassignedNotice`)}
        </Text>
      ) : null}
      {isFirstStepByStepNumber(stepNumber) &&
      login.auth_type !== FormAuthType.NIL ? (
        <WorkflowStepOneRestrictions
          form={form}
          formMethods={formMethods}
          authType={login.auth_type}
          isDisabled={isFormPublic || isLoading}
        />
      ) : null}
    </EditStepBlockContainer>
  )
}

const WorkflowStepOneRestrictions = ({
  form,
  formMethods,
  authType,
  isDisabled,
}: {
  form: AdminMultirespondentFormDto
  formMethods: UseFormReturn<EditStepInputs>
  authType: FormAuthType
  isDisabled: boolean
}) => {
  const { data: settings } = useAdminFormSettings<MultirespondentFormSettings>()
  const { setFieldListTabIndex, handleBuilderClick } = useCreatePageSidebar()
  const draft = formMethods.watch('first_step_restrictions')

  // Converting the NRIC/FIN/UEN setting adds identity fields to the saved
  // Step 1. Keep them in this draft so saving it does not unassign them.
  const savedFieldIds = form.workflow[0]?.edit
  const prevSavedFieldIds = useRef(savedFieldIds)
  useEffect(() => {
    const prev = prevSavedFieldIds.current ?? []
    prevSavedFieldIds.current = savedFieldIds
    const added = (savedFieldIds ?? []).filter((id) => !prev.includes(id))
    if (!added.length) return
    const picked = formMethods.getValues(FIELDS_TO_EDIT_NAME) ?? []
    const missing = added.filter((id) => !picked.includes(id))
    if (missing.length)
      formMethods.setValue(FIELDS_TO_EDIT_NAME, [...picked, ...missing])
  }, [formMethods, savedFieldIds])

  if (!settings || settings.responseMode !== FormResponseMode.Multirespondent)
    return null
  const value = draft?.value ?? createStepOneLoginRestrictionsDraft(settings)
  return (
    <StepOneLoginRestrictions
      settings={settings}
      value={value}
      isDisabled={isDisabled}
      authType={authType}
      onGoToFields={(tab: FieldListTabIndex) => {
        setFieldListTabIndex(tab)
        handleBuilderClick(false)
      }}
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
            value: { ...value, ...patch },
          },
          { shouldDirty: true },
        )
      }
    />
  )
}
