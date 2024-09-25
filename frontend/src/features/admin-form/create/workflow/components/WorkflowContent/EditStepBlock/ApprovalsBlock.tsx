import { useCallback, useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'

import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Toggle from '~components/Toggle'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { EditStepInputs } from '../../../types'

import { EditStepBlockContainer } from './EditStepBlockContainer'

interface ApprovalsBlockProps {
  formMethods: UseFormReturn<EditStepInputs>
  stepNumber: number
}

const APPROVAL_FIELD_NAME = 'approval_field'
const FIELDS_TO_EDIT_NAME = 'edit'
export const ApprovalsBlock = ({
  formMethods,
  stepNumber,
}: ApprovalsBlockProps): JSX.Element => {
  const {
    control,
    setValue,
    formState: { errors },
    clearErrors,
    watch,
  } = formMethods
  const selectedApprovalField = watch(APPROVAL_FIELD_NAME)
  const selectedEditFields = watch(FIELDS_TO_EDIT_NAME)
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
      setValue(APPROVAL_FIELD_NAME, '')
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
      <FormLabel
        mb="0"
        isRequired
        tooltipVariant="info"
        tooltipPlacement="top"
        tooltipText="Use this for steps that involve any type of decision, such as reviews or endorsements"
      >
        Approval
      </FormLabel>
      <Toggle
        isLoading={isLoading}
        onChange={onApprovalToggleChange}
        isChecked={isApprovalToggleChecked}
        label="Enable approval"
        description="If the respondent selects yes, the workflow continues. If they select no, it ends."
      />
      {isApprovalToggleChecked ? (
        <FormControl isInvalid={!!errors.approval_field?.message}>
          <Controller
            name={APPROVAL_FIELD_NAME}
            control={control}
            rules={{
              validate: (value) => {
                if (!value && isApprovalToggleChecked) {
                  return 'Please select a Yes/No field'
                }
                if (value && approvalFieldsFromOtherSteps.includes(value)) {
                  return 'The selected field has been assigned to another step. Please choose a different field'
                }
                if (value && !selectedEditFields.includes(value)) {
                  return 'The selected Yes/No field has not been assigned to this respondent'
                }
              },
            }}
            render={({ field: { value = '', ...rest } }) => (
              <>
                <SingleSelect
                  placeholder="Select a Yes/No field from your form"
                  items={yesNoFieldItems}
                  value={getValueIfNotDeleted(value)}
                  isClearable
                  isDisabled={isLoading}
                  {...rest}
                />
              </>
            )}
          />
          <FormErrorMessage>{errors.approval_field?.message}</FormErrorMessage>
        </FormControl>
      ) : null}
    </EditStepBlockContainer>
  )
}
