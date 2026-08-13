import { useCallback, useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl } from '@chakra-ui/react'

import { textStyles } from '~theme/textStyles'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Toggle from '~components/Toggle'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { useIsWorkflowBuilderRedesign } from '../../../hooks/useIsWorkflowBuilderRedesign'
import { EditStepInputs } from '../../../types'
import { nextEditFieldsForApproval } from '../utils/nextEditFieldsForApproval'

import { APPROVAL_FIELD_NAME, FIELDS_TO_EDIT_NAME } from './EditStepBlock'
import { EditStepBlockContainer } from './EditStepBlockContainer'

interface ApprovalsBlockProps {
  formMethods: UseFormReturn<EditStepInputs>
  stepNumber: number
}

export const ApprovalsBlock = ({
  formMethods,
  stepNumber,
}: ApprovalsBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const {
    control,
    setValue,
    getValues,
    formState: { errors },
    clearErrors,
    watch,
  } = formMethods
  const selectedApprovalField = watch(APPROVAL_FIELD_NAME)
  const [isApprovalToggleChecked, setIsApprovalToggleChecked] = useState(
    !!selectedApprovalField,
  )
  const {
    yesNoFormFields = [],
    formWorkflow = [],
    isLoading,
  } = useAdminFormWorkflow()

  const yesNoFieldItems = yesNoFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )
  const yesNoFieldIds = yesNoFormFields.map(({ _id }) => _id)

  const approvalFieldsFromOtherSteps = formWorkflow
    .map((step, i) => {
      if (i === stepNumber) return null
      return step.approval_field
    })
    .filter(Boolean)

  const onApprovalToggleChange = () => {
    const nextIsApprovalToggleChecked = !isApprovalToggleChecked
    if (!nextIsApprovalToggleChecked) {
      // shouldDirty is required for auto-save-on-switch to notice this change:
      // the toggle's own state is React state, not RHF, so clearing the field
      // is the only thing that marks the form dirty. Without it, toggling
      // approval off and clicking another card discards the change silently.
      setValue(APPROVAL_FIELD_NAME, '', { shouldDirty: true })
      clearErrors(APPROVAL_FIELD_NAME)
    }
    setIsApprovalToggleChecked(nextIsApprovalToggleChecked)
  }

  const getValueIfNotDeleted = useCallback(
    (value: string) => {
      // Why: When the Yes/No field has been deleted, the approval_field is still set to the
      // invalid form field id but cannot be seen or cleared in the SingleSelect component
      // since no matching Yes/No item can be found.
      // Hence, we clear the approval_field to allow the user to re-select a new valid value.
      if (!isLoading && value && !yesNoFieldIds.includes(value)) {
        setValue(APPROVAL_FIELD_NAME, '')
        return ''
      }
      return value
    },
    [isLoading, setValue, yesNoFieldIds],
  )

  return (
    <EditStepBlockContainer>
      <Toggle
        isLoading={isLoading}
        onChange={onApprovalToggleChange}
        isChecked={isApprovalToggleChecked}
        labelStyles={textStyles.h4}
        label={t(
          isRedesign
            ? 'features.adminForm.sidebar.workflow.approvals.toggle.labelRedesign'
            : 'features.adminForm.sidebar.workflow.approvals.toggle.label',
        )}
        description={t(
          isRedesign
            ? 'features.adminForm.sidebar.workflow.approvals.toggle.descriptionRedesign'
            : 'features.adminForm.sidebar.workflow.approvals.toggle.description',
        )}
        tooltipText={
          isRedesign
            ? undefined
            : t('features.adminForm.sidebar.workflow.approvals.toggle.tooltip')
        }
        tooltipVariant="info"
        tooltipPlacement="top"
      />
      {isApprovalToggleChecked ? (
        <FormControl
          isInvalid={!!errors.approval_field?.message}
          {...(isRedesign ? { isRequired: true, mt: '1rem' } : {})}
        >
          {isRedesign ? (
            <FormLabel style={textStyles.h4}>
              {t(
                'features.adminForm.sidebar.workflow.approvals.toggle.selectorLabelRedesign',
              )}
            </FormLabel>
          ) : null}
          <Controller
            name={APPROVAL_FIELD_NAME}
            control={control}
            rules={{
              validate: (value) => {
                if (!value && isApprovalToggleChecked) {
                  return t(
                    isRedesign
                      ? 'features.adminForm.sidebar.workflow.approvals.validation.noFieldRedesign'
                      : 'features.adminForm.sidebar.workflow.approvals.validation.noField',
                  )
                }
                if (value && approvalFieldsFromOtherSteps.includes(value)) {
                  return t(
                    'features.adminForm.sidebar.workflow.approvals.validation.fieldAlreadyUsed',
                  )
                }
                // Read `edit` live rather than via the watched closure: the
                // sibling QuestionsBlock calls trigger() synchronously in its
                // onChange, before this component re-renders, so a closed-over
                // value would be one change stale.
                if (value && !getValues(FIELDS_TO_EDIT_NAME).includes(value)) {
                  return t(
                    isRedesign
                      ? 'features.adminForm.sidebar.workflow.approvals.validation.fieldNotAssignedToUserRedesign'
                      : 'features.adminForm.sidebar.workflow.approvals.validation.fieldNotAssignedToUser',
                  )
                }
              },
            }}
            render={({ field: { value = '', onChange, ...rest } }) => {
              const handleApprovalFieldChange = (newValue: string) => {
                onChange(newValue)
                setValue(
                  FIELDS_TO_EDIT_NAME,
                  nextEditFieldsForApproval({
                    edit: getValues(FIELDS_TO_EDIT_NAME),
                    approvalFieldId: newValue,
                    isEnabled: isRedesign,
                  }),
                  { shouldDirty: true },
                )
              }
              return (
                <SingleSelect
                  placeholder={t(
                    'features.adminForm.sidebar.workflow.approvals.toggle.placeholder',
                  )}
                  items={yesNoFieldItems}
                  value={getValueIfNotDeleted(value)}
                  isClearable
                  isDisabled={isLoading}
                  onChange={handleApprovalFieldChange}
                  {...rest}
                />
              )
            }}
          />
          <FormErrorMessage>{errors.approval_field?.message}</FormErrorMessage>
        </FormControl>
      ) : null}
    </EditStepBlockContainer>
  )
}
