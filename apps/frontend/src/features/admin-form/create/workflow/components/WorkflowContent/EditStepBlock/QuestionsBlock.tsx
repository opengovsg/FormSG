import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, FormHelperText } from '@chakra-ui/react'

import { workflowNs } from '~/i18n/locales/features/admin-form/sidebar/workflow'

import { textStyles } from '~theme/textStyles'
import { MultiSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { getLogicFieldLabel } from '~features/admin-form/create/logic/components/LogicContent/utils/getLogicFieldLabel'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'
import { NON_RESPONSE_FIELD_SET } from '~features/form/constants'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { useIsWorkflowBuilderRedesign } from '../../../hooks/useIsWorkflowBuilderRedesign'
import { useStageFieldAndNavigate } from '../../../hooks/useStageFieldAndNavigate'

import { APPROVAL_FIELD_NAME, FIELDS_TO_EDIT_NAME } from './EditStepBlock'
import { EditStepBlockContainer } from './EditStepBlockContainer'
import { FieldEmptyState } from './EmptyStates'

interface QuestionsBlockProps {
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
  isFirstStep: boolean
}

export const QuestionsBlock = ({
  isLoading,
  formMethods,
  isFirstStep,
}: QuestionsBlockProps): JSX.Element => {
  const { t } = useTranslation(workflowNs)
  const isRedesign = useIsWorkflowBuilderRedesign()
  const stageFieldAndNavigate = useStageFieldAndNavigate()
  const { formFields = [], idToFieldMap } = useAdminFormWorkflow()
  const {
    formState: { errors },
    control,
    watch,
    trigger,
    getValues,
  } = formMethods
  const selectedApprovalField = watch(APPROVAL_FIELD_NAME)

  const fillableFields = formFields.filter(
    (f) => !NON_RESPONSE_FIELD_SET.has(f.fieldType),
  )

  const items = fillableFields
    // TODO(MRF-MYINFO): Remove this restriction once MyInfo fields are
    .filter((f) => !('myInfo' in f) || isFirstStep)
    .map((f) => ({
      value: f._id,
      label: getLogicFieldLabel(idToFieldMap[f._id]),
      icon: BASICFIELD_TO_DRAWER_META[f.fieldType].icon,
    }))

  const hasOnlyMyInfoFields = items.length === 0 && fillableFields.length > 0

  const showEmptyState = isRedesign && items.length === 0

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
          tooltipText={isRedesign ? undefined : t('questions.tooltip')}
        >
          {t(isRedesign ? 'questions.labelRedesign' : 'questions.label')}
        </FormLabel>
        <Controller
          control={control}
          name={FIELDS_TO_EDIT_NAME}
          render={({ field: { value = [], onChange, ...field } }) => {
            if (showEmptyState) {
              return (
                <FieldEmptyState
                  picker="fields"
                  message={t(
                    hasOnlyMyInfoFields
                      ? 'emptyStates.noFieldsMyInfoOnly'
                      : 'emptyStates.noFields',
                  )}
                  actionLabel={t('emptyStates.noFieldsAction')}
                  onAction={() => stageFieldAndNavigate(undefined, getValues())}
                />
              )
            }
            const handleFieldsChange = (newValue: string[]) => {
              onChange(newValue)
              if (isRedesign && selectedApprovalField) {
                void trigger(APPROVAL_FIELD_NAME)
              }
            }
            return (
              <MultiSelect
                isDisabled={isLoading}
                placeholder={t(
                  isRedesign
                    ? 'questions.placeholderRedesign'
                    : 'questions.placeholder',
                )}
                items={items}
                isSelectedItemFullWidth
                values={value}
                onChange={handleFieldsChange}
                {...field}
              />
            )
          }}
        />
        {isRedesign && selectedApprovalField ? (
          <FormHelperText>
            {t('questions.autoAddHelperTextRedesign')}
          </FormHelperText>
        ) : null}
        <FormErrorMessage>{errors.workflow_type?.message}</FormErrorMessage>
      </FormControl>
    </EditStepBlockContainer>
  )
}
