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
import { useIsWorkflowBuilderRedesign } from '../../../hooks/useIsWorkflowBuilderRedesign'
import { useStageFieldAndNavigate } from '../../../hooks/useStageFieldAndNavigate'

import { FIELDS_TO_EDIT_NAME } from './EditStepBlock'
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
  const { t } = useTranslation()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const stageFieldAndNavigate = useStageFieldAndNavigate()
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

  // The empty state only exists under the redesign flag. With it off, the
  // picker renders as it does today: enabled, and holding nothing.
  const showEmptyState = isRedesign && items.length === 0

  return (
    <EditStepBlockContainer>
      <FormControl
        isReadOnly={isLoading}
        id={FIELDS_TO_EDIT_NAME}
        isRequired={!showEmptyState}
        isInvalid={!!errors.edit}
      >
        <FormLabel
          style={textStyles.h4}
          tooltipVariant="info"
          tooltipPlacement="top"
          tooltipText={t(
            isRedesign
              ? 'features.adminForm.sidebar.workflow.questions.tooltipRedesign'
              : 'features.adminForm.sidebar.workflow.questions.tooltip',
          )}
        >
          {t(
            isRedesign
              ? 'features.adminForm.sidebar.workflow.questions.labelRedesign'
              : 'features.adminForm.sidebar.workflow.questions.label',
          )}
        </FormLabel>
        {showEmptyState ? (
          <FieldEmptyState
            picker="fields"
            message={t(
              'features.adminForm.sidebar.workflow.emptyStates.noFields',
            )}
            actionLabel={t(
              'features.adminForm.sidebar.workflow.emptyStates.noFieldsAction',
            )}
            // No field type staged: the admin chooses what to build.
            onAction={() => stageFieldAndNavigate()}
          />
        ) : (
          <Controller
            control={control}
            name={FIELDS_TO_EDIT_NAME}
            render={({ field: { value = [], ...field } }) => (
              <MultiSelect
                isDisabled={isLoading}
                placeholder={t(
                  isRedesign
                    ? 'features.adminForm.sidebar.workflow.questions.placeholderRedesign'
                    : 'features.adminForm.sidebar.workflow.questions.placeholder',
                )}
                items={items}
                isSelectedItemFullWidth
                values={value}
                {...field}
              />
            )}
          />
        )}
        <FormErrorMessage>{errors.workflow_type?.message}</FormErrorMessage>
      </FormControl>
    </EditStepBlockContainer>
  )
}
