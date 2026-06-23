import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Text } from '@chakra-ui/react'

import Button from '~components/Button'
import { MultiSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'

import { useCreatePageSidebar } from '~features/admin-form/create/common'
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
  showGuidedHint?: boolean
}

export const QuestionsBlock = ({
  isLoading,
  formMethods,
  isFirstStep,
  showGuidedHint,
}: QuestionsBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const { formFields = [], idToFieldMap } = useAdminFormWorkflow()
  const { handleBuilderClick } = useCreatePageSidebar()
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
      // TODO(MRF-MYINFO): Remove this restriction once MyInfo fields are
      // supported in workflow steps >= 2.
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

  const hasFields = items.length > 0

  return (
    <EditStepBlockContainer>
      <FormControl
        isReadOnly={isLoading}
        id={FIELDS_TO_EDIT_NAME}
        isRequired
        isInvalid={!!errors.edit}
      >
        <Text textStyle="subhead-2" mb="0.75rem">
          {t('features.adminForm.sidebar.workflow.questions.label')}
        </Text>
        {showGuidedHint && !hasFields ? (
          <>
            <Text textStyle="body-2" color="secondary.400" mb="0.5rem">
              Your form has no fields yet. Add some or skip this for now.
            </Text>
            <Button
              variant="outline"
              size="sm"
              w="100%"
              onClick={() => handleBuilderClick(false)}
            >
              Add fields
            </Button>
          </>
        ) : (
          <>
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
            {showGuidedHint && hasFields && (
              <Text textStyle="body-2" color="secondary.400" mt="0.5rem">
                Pick the fields they&apos;ll fill in. You can always change this
                later.
              </Text>
            )}
          </>
        )}
        <FormErrorMessage>{errors.edit?.message}</FormErrorMessage>
      </FormControl>
    </EditStepBlockContainer>
  )
}
