import { useRef, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Text } from '@chakra-ui/react'

import {
  AdminMultirespondentFormDto,
  FirstStepLoginInput,
  FormAuthType,
  FormResponseMode,
  FormStatus,
  MultirespondentFormSettings,
  StepLoginAuthType,
} from 'formsg-shared/types'

import { textStyles } from '~theme/textStyles'

import { useAdminForm } from '~features/admin-form/common/queries'
import { AuthSwitchConfirmation } from '~features/admin-form/settings/components/AuthSettingsSection/AuthSwitchConfirmation'
import { StepLoginControls } from '~features/admin-form/settings/components/AuthSettingsSection/StepLoginControls'
import {
  createStepOneLoginRestrictionsDraft,
  StepOneLoginRestrictions,
} from '~features/admin-form/settings/components/AuthSettingsSection/StepOneLoginRestrictions'
import { useAdminFormSettings } from '~features/admin-form/settings/queries'

import { useIsWorkflowBuilderRedesign } from '../../../hooks/useIsWorkflowBuilderRedesign'
import { EditStepInputs } from '../../../types'
import {
  getAffectedAuthFieldRules,
  getAuthSwitchConsequences,
} from '../../../utils/authFieldRemoval'
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
 * through `first_step_login`; later steps stage their own `auth`. A provider
 * change asks to unassign incompatible fields in the same draft.
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
  const confirmationBaseline = useRef(form?.lastModified)
  const { watch, setValue } = formMethods
  const [pendingAuthType, setPendingAuthType] = useState<StepLoginAuthType>()
  const [hasUnassignedFields, setHasUnassignedFields] = useState(false)

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

  const consequences =
    pendingAuthType === undefined
      ? { deletedFields: [], unassignedFields: [] }
      : getAuthSwitchConsequences(
          form as AdminMultirespondentFormDto,
          stepNumber,
          pendingAuthType,
          pickedFieldIds,
        )
  const isDeletingFields = consequences.deletedFields.length > 0
  const confirmationFields = isDeletingFields
    ? consequences.deletedFields
    : consequences.unassignedFields
  const handleAuthTypeChange = (next: StepLoginAuthType) => {
    if (isFormPublic || isLoading || next === login.auth_type) return
    const proposed = getAuthSwitchConsequences(
      form as AdminMultirespondentFormDto,
      stepNumber,
      next,
      pickedFieldIds,
    )
    if (proposed.deletedFields.length || proposed.unassignedFields.length) {
      setPendingAuthType(next)
      return
    }
    setValue('delete_auth_field_ids', [], { shouldDirty: true })
    setValue('expected_last_modified', undefined, { shouldDirty: true })
    write({ auth_type: next, esrvc_id: login.esrvc_id })
  }
  const confirmSwitch = () => {
    if (pendingAuthType === undefined || isFormPublic || isLoading) return
    const incompatibleIds = new Set(
      consequences.unassignedFields.map((field) => field._id),
    )
    setValue(
      FIELDS_TO_EDIT_NAME,
      pickedFieldIds.filter((id) => !incompatibleIds.has(id)),
      { shouldDirty: true, shouldValidate: true },
    )
    setValue(
      'delete_auth_field_ids',
      consequences.deletedFields.map((field) => field._id),
      { shouldDirty: true },
    )
    setValue('expected_last_modified', confirmationBaseline.current, {
      shouldDirty: true,
    })
    write({ auth_type: pendingAuthType, esrvc_id: login.esrvc_id })
    setHasUnassignedFields(consequences.unassignedFields.length > 0)
    setPendingAuthType(undefined)
  }

  return (
    <EditStepBlockContainer>
      <AuthSwitchConfirmation
        currentAuthType={login.auth_type}
        nextAuthType={pendingAuthType}
        fields={confirmationFields}
        formFields={form?.form_fields ?? []}
        deleteFields={isDeletingFields}
        affectedRules={getAffectedAuthFieldRules(
          form as AdminMultirespondentFormDto,
          consequences.deletedFields.map((field) => field._id),
        )}
        onClose={() => setPendingAuthType(undefined)}
        onConfirm={confirmSwitch}
      />
      {!isRedesign || isGuidedSection ? (
        <Text style={textStyles.h4}>{t(`${COPY_KEY}.title`)}</Text>
      ) : null}
      <StepLoginControls
        isTitleToggle={isRedesign && !isGuidedSection}
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
      />
      {hasUnassignedFields ? (
        <Text textStyle="body-2" color="secondary.400">
          Incompatible fields are unassigned in this draft. Confirmed field
          deletions apply only when you save or navigate away.
        </Text>
      ) : null}
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
