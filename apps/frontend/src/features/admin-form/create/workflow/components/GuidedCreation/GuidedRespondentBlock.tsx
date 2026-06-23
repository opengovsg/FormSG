import { UseFormReturn } from 'react-hook-form'
import { Stack, Text } from '@chakra-ui/react'

import { WorkflowType } from 'formsg-shared/types'

import Radio from '~components/Radio'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'

import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { EditStepBlockContainer } from '../WorkflowContent/EditStepBlock/EditStepBlockContainer'
import { ConditionalRoutingOption } from '../WorkflowContent/EditStepBlock/RespondentBlock/Components/ConditionalRoutingOption'
import { DynamicRespondentOption } from '../WorkflowContent/EditStepBlock/RespondentBlock/Components/DynamicRespondentOption'
import { StaticRespondentOption } from '../WorkflowContent/EditStepBlock/RespondentBlock/Components/StaticRespondentOption'

interface GuidedRespondentBlockProps {
  stepNumber: number
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
  isActive: boolean
}

export const GuidedRespondentBlock = ({
  stepNumber,
  isLoading,
  formMethods,
  isActive,
}: GuidedRespondentBlockProps): JSX.Element => {
  const { emailFormFields = [], dropdownFormFields = [] } =
    useAdminFormWorkflow()

  const emailFieldItems = emailFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )

  const selectedWorkflowType =
    formMethods.watch('workflow_type') ?? WorkflowType.Static

  return (
    <EditStepBlockContainer>
      <Stack spacing="0.5rem">
        <Text textStyle="subhead-2">Who fills in this step</Text>
        {isActive && (
          <Text textStyle="body-2" color="secondary.400">
            Pick who fills in this step. You can always change this later.
          </Text>
        )}

        <Radio.RadioGroup value={selectedWorkflowType}>
          <StaticRespondentOption
            selectedWorkflowType={selectedWorkflowType}
            formMethods={formMethods}
            isLoading={isLoading}
          />

          <DynamicRespondentOption
            selectedWorkflowType={selectedWorkflowType}
            emailFieldItems={emailFieldItems}
            formMethods={formMethods}
            isLoading={isLoading}
          />

          <ConditionalRoutingOption
            selectedWorkflowType={selectedWorkflowType}
            conditionalFormFields={dropdownFormFields}
            formMethods={formMethods}
            isLoading={isLoading}
          />
        </Radio.RadioGroup>
      </Stack>
    </EditStepBlockContainer>
  )
}
