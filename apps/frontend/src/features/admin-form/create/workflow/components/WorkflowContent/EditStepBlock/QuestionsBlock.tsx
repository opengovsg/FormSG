import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, FormHelperText } from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types'
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
import { NON_RESPONSE_FIELD_SET } from '~features/form/constants'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { useIsWorkflowBuilderRedesign } from '../../../hooks/useIsWorkflowBuilderRedesign'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { APPROVAL_FIELD_NAME, FIELDS_TO_EDIT_NAME } from './EditStepBlock'
import { EditStepBlockContainer } from './EditStepBlockContainer'

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
  const isRedesign = useIsWorkflowBuilderRedesign()
  const { withAddFieldItem, withAddFieldAction } = useAddFieldPicker({
    label: t('features.adminForm.sidebar.workflow.addField.fields'),
    enabled: isRedesign,
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

  // The login as edited in this card, since the picker follows unsaved
  // login changes. Step 1's login is the form-level one.
  const editedAuthType: FormAuthType = isFirstStepByStepNumber(stepNumber)
    ? (watch('first_step_login')?.auth_type ??
      form?.authType ??
      FormAuthType.NIL)
    : (watch('auth')?.auth_type ?? FormAuthType.NIL)

  const fillableFields = formFields.filter(
    (f) => !NON_RESPONSE_FIELD_SET.has(f.fieldType),
  )

  const fieldItems = fillableFields
    // A login-filled field is offered only to a step whose login fills it,
    // and to one step at a time. Fields already on this step stay listed so
    // they can be removed.
    .filter((f) => {
      if (pickedFieldIds.includes(f._id)) return true
      if (!canStepLoginFillField(f, editedAuthType)) return false
      if (!getFieldSourceProvider(f)) return true
      const owner = getOwningStepIndex(f, formWorkflow)
      return owner === undefined || owner === stepNumber
    })
    .map((f) => ({
      value: f._id,
      label: getLogicFieldLabel(idToFieldMap[f._id]),
      icon: BASICFIELD_TO_DRAWER_META[f.fieldType].icon,
    }))

  const hasOnlyLoginFields =
    fieldItems.length === 0 && fillableFields.length > 0

  return (
    <EditStepBlockContainer>
      <FormControl
        isReadOnly={isLoading}
        id={FIELDS_TO_EDIT_NAME}
        isRequired
        isInvalid={!!errors.edit}
      >
        <FormLabel
          style={textStyles.h4}
          tooltipVariant="info"
          tooltipPlacement="top"
          tooltipText={
            isRedesign
              ? undefined
              : t('features.adminForm.sidebar.workflow.questions.tooltip')
          }
        >
          {t(
            isRedesign
              ? 'features.adminForm.sidebar.workflow.questions.labelRedesign'
              : 'features.adminForm.sidebar.workflow.questions.label',
          )}
        </FormLabel>
        <Controller
          control={control}
          name={FIELDS_TO_EDIT_NAME}
          render={({ field: { value = [], onChange, ...field } }) => {
            const handleFieldsChange = withAddFieldAction(
              (newValue: string[]) => {
                onChange(newValue)
                if (isRedesign && selectedApprovalField) {
                  void trigger(APPROVAL_FIELD_NAME)
                }
              },
            )
            return (
              <MultiSelect
                isDisabled={isLoading}
                placeholder={t(
                  isRedesign
                    ? 'features.adminForm.sidebar.workflow.questions.placeholderRedesign'
                    : 'features.adminForm.sidebar.workflow.questions.placeholder',
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
        {isRedesign && hasOnlyLoginFields ? (
          <FormHelperText>
            {t(
              'features.adminForm.sidebar.workflow.questions.loginFieldsHelperText',
            )}
          </FormHelperText>
        ) : null}
        {isRedesign && selectedApprovalField ? (
          <FormHelperText>
            {t(
              'features.adminForm.sidebar.workflow.questions.autoAddHelperTextRedesign',
            )}
          </FormHelperText>
        ) : null}
        <FormErrorMessage>{errors.workflow_type?.message}</FormErrorMessage>
      </FormControl>
    </EditStepBlockContainer>
  )
}
