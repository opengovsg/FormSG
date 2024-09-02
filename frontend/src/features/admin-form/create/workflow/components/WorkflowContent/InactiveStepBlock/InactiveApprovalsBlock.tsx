import { Stack, Text } from '@chakra-ui/react'
import { Dictionary } from 'lodash'

import { FormField, FormWorkflowStepDto } from '~shared/types'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { FormFieldWithQuestionNo } from '~features/form/types'

interface ApprovalStepBadgeProps {
  approvalFormField?: FormFieldWithQuestionNo<FormField>
}

const ApprovalStepBadge = ({
  approvalFormField,
}: ApprovalStepBadgeProps): JSX.Element | null => {
  if (!approvalFormField) {
    return (
      <FieldLogicBadge
        defaults={{
          variant: 'info',
          message: 'Approval not required in this step',
        }}
      />
    )
  }
  return <FieldLogicBadge field={approvalFormField} />
}

interface InactiveApprovalsBlockProps {
  step: FormWorkflowStepDto
  idToFieldMap: Dictionary<FormFieldWithQuestionNo<FormField>>
}

export const InactiveApprovalsBlock = ({
  step,
  idToFieldMap,
}: InactiveApprovalsBlockProps) => {
  const approvalFormField = step.approval_field
    ? idToFieldMap[step.approval_field]
    : undefined

  const headerText = approvalFormField
    ? 'Approval step enabled'
    : 'Approval step not enabled'

  return (
    <Stack>
      <Text textStyle="subhead-3">{headerText}</Text>
      <Stack direction="column" spacing="0.25rem">
        <ApprovalStepBadge approvalFormField={approvalFormField} />
      </Stack>
    </Stack>
  )
}
