import { useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'

import { SingleSelect } from '~components/Dropdown'
import Toggle from '~components/Toggle'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { EditStepInputs } from '../../../types'

import { FormStepWithHeader } from './FormStepWithHeader'

interface ApprovalsBlockProps {
  formMethods: UseFormReturn<EditStepInputs>
}

export const ApprovalsBlock = ({
  formMethods,
}: ApprovalsBlockProps): JSX.Element => {
  const [isApprovalToggleChecked, setIsApprovalToggleChecked] = useState(false)

  const { control } = formMethods
  const { yesNoFormFields = [] } = useAdminFormWorkflow()

  const yesNoFieldItems = yesNoFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )

  return (
    <FormStepWithHeader
      headerText="Approval step"
      tooltipText="Use this for steps that involve any type of decision, such as reviews or endorsements"
    >
      <Toggle
        onChange={() => setIsApprovalToggleChecked(!isApprovalToggleChecked)}
        isChecked={isApprovalToggleChecked}
        label="Enable approval for this step"
        description="If the respondent selects yes, the workflow continues. If they select no, it stops."
      />
      {isApprovalToggleChecked ? (
        <FormControl>
          <Controller
            name="approval_field"
            control={control}
            render={({ field: { value = '', ...rest } }) => (
              <SingleSelect
                placeholder="Select a Yes/No field from your form"
                items={yesNoFieldItems}
                value={value}
                isClearable
                {...rest}
              />
            )}
          />
        </FormControl>
      ) : null}
    </FormStepWithHeader>
  )
}
