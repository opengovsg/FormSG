import { useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { FormControl, FormErrorMessage } from '@chakra-ui/react'

import { SingleSelect } from '~components/Dropdown'
import Toggle from '~components/Toggle'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { EditStepInputs } from '../../../types'

import { FormStepWithHeader } from './FormStepWithHeader'

interface ApprovalsBlockProps {
  formMethods: UseFormReturn<EditStepInputs>
  stepNumber: number
}

const APPROVAL_FIELD_NAME = 'approval_field'
export const ApprovalsBlock = ({
  formMethods,
  stepNumber,
}: ApprovalsBlockProps): JSX.Element => {
  const {
    control,
    getValues,
    setValue,
    formState: { errors },
  } = formMethods
  const selectedApprovalField = getValues(APPROVAL_FIELD_NAME)
  const selectedEditFields = getValues('edit')
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
    }
    setIsApprovalToggleChecked(nextIsApprovalToggleChecked)
  }

  return (
    <FormStepWithHeader
      headerText="Approval step"
      tooltipText="Use this for steps that involve any type of decision, such as reviews or endorsements"
    >
      <Toggle
        isLoading={isLoading}
        onChange={onApprovalToggleChange}
        isChecked={isApprovalToggleChecked}
        label="Enable approval for this step"
        description="If the respondent selects yes, the workflow continues. If they select no, it stops."
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
              <SingleSelect
                placeholder="Select a Yes/No field from your form"
                items={yesNoFieldItems}
                value={value}
                isClearable
                isDisabled={isLoading}
                {...rest}
              />
            )}
          />
          <FormErrorMessage>{errors.approval_field?.message}</FormErrorMessage>
        </FormControl>
      ) : null}
    </FormStepWithHeader>
  )
}
