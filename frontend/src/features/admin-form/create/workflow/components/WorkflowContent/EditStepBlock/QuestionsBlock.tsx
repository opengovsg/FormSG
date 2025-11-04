import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl } from '@chakra-ui/react'

import { textStyles } from '~theme/textStyles'
import { MultiSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { getLogicFieldLabel } from '~features/admin-form/create/logic/components/LogicContent/utils/getLogicFieldLabel'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'
import { NON_RESPONSE_FIELD_SET } from '~features/form/constants'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'

import { FIELDS_TO_EDIT_NAME } from './EditStepBlock'
import { EditStepBlockContainer } from './EditStepBlockContainer'

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
  const { t } = useTranslation()
  const { formFields = [], idToFieldMap } = useAdminFormWorkflow()
  const {
    formState: { errors },
    control,
  } = formMethods

  const items = formFields
    .filter((f) => {
      // Only retain actual inputs (exclude header, statement, image)
      const isFillableField = !NON_RESPONSE_FIELD_SET.has(f.fieldType)
      const isMyInfoField = 'myInfo' in f
      if (!isFillableField) {
        return false
      }
      if (isMyInfoField && !isFirstStep) {
        return false
      }
      return true
    })
    .map((f) => ({
      value: f._id,
      label: getLogicFieldLabel(idToFieldMap[f._id]),
      icon: BASICFIELD_TO_DRAWER_META[f.fieldType].icon,
    }))

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
          tooltipText={t(
            'features.adminForm.sidebar.workflow.questions.tooltip',
          )}
        >
          {t('features.adminForm.sidebar.workflow.questions.label')}
        </FormLabel>
        <Controller
          control={control}
          name={FIELDS_TO_EDIT_NAME}
          render={({ field: { value = [], ...field } }) => (
            <MultiSelect
              isDisabled={isLoading}
              placeholder={t(
                'features.adminForm.sidebar.workflow.questions.placeholder',
              )}
              items={items}
              isSelectedItemFullWidth
              values={value}
              {...field}
            />
          )}
        />
        <FormErrorMessage>{errors.workflow_type?.message}</FormErrorMessage>
      </FormControl>
    </EditStepBlockContainer>
  )
}
