import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, FormHelperText } from '@chakra-ui/react'

import { FormAuthType, FormResponseMode } from 'formsg-shared/types'
import { isLoginField } from 'formsg-shared/utils/login-identity'
import {
  canStepLoginFillField,
  getFieldSourceProvider,
  getOwningStepIndex,
} from 'formsg-shared/utils/step-login'

import { textStyles } from '~theme/textStyles'
import { MultiSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useAddFieldPicker } from '~features/admin-form/create/common/useAddFieldPicker'
import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { getLogicFieldLabel } from '~features/admin-form/create/logic/components/LogicContent/utils/getLogicFieldLabel'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'
import { AuthSwitchConfirmation } from '~features/admin-form/settings/components/AuthSettingsSection/AuthSwitchConfirmation'
import { NON_RESPONSE_FIELD_SET } from '~features/form/constants'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { useIsStepLoginShown } from '../../../hooks/useIsStepLoginShown'
import { STEP_LOGIN_LABEL_KEYS } from '../../../utils/stepLoginAvailability'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { APPROVAL_FIELD_NAME, FIELDS_TO_EDIT_NAME } from './EditStepBlock'
import { EditStepBlockContainer } from './EditStepBlockContainer'
import { useStepEditorLogin } from './useStepEditorLogin'

const FIELD_TAGS_KEY = 'features.adminForm.sidebar.workflow.stepLogin.fieldTags'

interface QuestionsBlockProps {
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
  stepNumber: number
}

export const QuestionsBlock = ({
  isLoading,
  formMethods,
  stepNumber,
}: QuestionsBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const isLoginShown = useIsStepLoginShown(stepNumber)
  const { withAddFieldItem, withAddFieldAction } = useAddFieldPicker({
    label: t('features.adminForm.sidebar.workflow.addField.fields'),
  })
  const { data: form } = useAdminForm()
  const {
    formFields = [],
    formWorkflow = [],
    idToFieldMap,
  } = useAdminFormWorkflow()
  const {
    formState: { errors },
    control,
    watch,
    trigger,
  } = formMethods
  const selectedApprovalField = watch(APPROVAL_FIELD_NAME)
  const pickedFieldIds: string[] = watch(FIELDS_TO_EDIT_NAME) ?? []

  // The picker follows unsaved login changes made in this card.
  const {
    login: { auth_type: editedAuthType },
    requestSwitch,
    confirmationProps,
  } = useStepEditorLogin({
    form:
      form?.responseMode === FormResponseMode.Multirespondent
        ? form
        : undefined,
    formMethods,
    stepNumber,
    isDisabled: isLoading,
  })

  const fillableFields = formFields.filter(
    (f) => !NON_RESPONSE_FIELD_SET.has(f.fieldType),
  )
  const savedStepFieldIds: string[] = formWorkflow[stepNumber]?.edit ?? []

  const fieldItems = fillableFields
    // A login-filled field is offered only to a step whose login fills it,
    // and to one step at a time. Fields already on this step stay listed so
    // they can be removed.
    .filter((f) => {
      // Without step logins, login-filled fields stay on Step 1 only. A later
      // step saved with a login keeps its own: the picker only keeps values
      // it lists, so hiding them would drop them on the next change.
      if (!isLoginShown)
        return (
          isFirstStepByStepNumber(stepNumber) ||
          !isLoginField(f) ||
          savedStepFieldIds.includes(f._id)
        )
      if (isLoginShown || pickedFieldIds.includes(f._id)) return true
      if (!canStepLoginFillField(f, editedAuthType)) return false
      if (!getFieldSourceProvider(f)) return true
      const owner = getOwningStepIndex(f, formWorkflow)
      return owner === undefined || owner === stepNumber
    })
    .map((f) => {
      const provider = getFieldSourceProvider(f)
      const owner = provider ? getOwningStepIndex(f, formWorkflow) : undefined
      const isUnavailable = isLoginShown && !pickedFieldIds.includes(f._id)
      const ownedElsewhere =
        isUnavailable && owner !== undefined && owner !== stepNumber
      // A step with the other login cannot take this field.
      // Picking it asks to convert to that login.
      const needsOtherLogin =
        isUnavailable &&
        !!provider &&
        editedAuthType !== FormAuthType.NIL &&
        !canStepLoginFillField(f, editedAuthType)
      return {
        value: f._id,
        label: getLogicFieldLabel(idToFieldMap[f._id]),
        icon: BASICFIELD_TO_DRAWER_META[f.fieldType].icon,
        disabled: ownedElsewhere || needsOtherLogin,
        descriptionTag: ownedElsewhere
          ? t(`${FIELD_TAGS_KEY}.assignedToStep`, { stepNumber: owner + 1 })
          : needsOtherLogin
            ? t(`${FIELD_TAGS_KEY}.providerOnly`, {
                provider: t(STEP_LOGIN_LABEL_KEYS[provider]),
              })
            : undefined,
      }
    })

  const hasOnlyLoginFields =
    fieldItems.length === 0 && fillableFields.length > 0

  return (
    <EditStepBlockContainer>
      {isLoginShown ? <AuthSwitchConfirmation {...confirmationProps} /> : null}
      <FormControl
        isReadOnly={isLoading}
        id={FIELDS_TO_EDIT_NAME}
        isRequired
        isInvalid={!!errors.edit}
      >
        <FormLabel style={textStyles.h4}>
          {t('features.adminForm.sidebar.workflow.questions.label')}
        </FormLabel>
        <Controller
          control={control}
          name={FIELDS_TO_EDIT_NAME}
          render={({ field: { value = [], onChange, ...field } }) => {
            const handleFieldsChange = withAddFieldAction(
              (newValue: string[]) => {
                const addedId = newValue.find((id) => !value.includes(id))
                const added = formFields.find((f) => f._id === addedId)
                const provider = added && getFieldSourceProvider(added)
                if (
                  isLoginShown &&
                  added &&
                  provider &&
                  !canStepLoginFillField(added, editedAuthType)
                ) {
                  requestSwitch(provider, added._id)
                  return
                }
                onChange(newValue)
                if (selectedApprovalField) {
                  void trigger(APPROVAL_FIELD_NAME)
                }
              },
            )
            return (
              <MultiSelect
                isDisabled={isLoading}
                placeholder={t(
                  'features.adminForm.sidebar.workflow.questions.placeholder',
                )}
                items={withAddFieldItem(fieldItems)}
                isSelectedItemFullWidth
                values={value}
                onChange={handleFieldsChange}
                {...field}
              />
            )
          }}
        />
        {hasOnlyLoginFields ? (
          <FormHelperText>
            {t(
              isLoginShown
                ? 'features.adminForm.sidebar.workflow.questions.loginFieldsHelperText'
                : 'features.adminForm.sidebar.workflow.questions.stepOneOnlyHelperText',
            )}
          </FormHelperText>
        ) : null}
        {selectedApprovalField ? (
          <FormHelperText>
            {t(
              'features.adminForm.sidebar.workflow.questions.autoAddHelperText',
            )}
          </FormHelperText>
        ) : null}
        <FormErrorMessage>
          {(isLoginShown ? errors.edit : errors.workflow_type)?.message}
        </FormErrorMessage>
      </FormControl>
    </EditStepBlockContainer>
  )
}
