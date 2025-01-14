import { Stack, Text } from '@chakra-ui/react'
import { Dictionary } from 'lodash'

import { FormField, FormWorkflowStepDto } from '~shared/types'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { FormFieldWithQuestionNo } from '~features/form/types'

interface ApprovalStepBadgeProps {
  approvalFormField?: FormFieldWithQuestionNo<FormField>
  isDeleted?: boolean
}

const ApprovalStepBadge = ({
  approvalFormField,
  isDeleted = false,
}: ApprovalStepBadgeProps): JSX.Element | null => {
  if (isDeleted) {
    return (
      <FieldLogicBadge
        defaults={{
          variant: 'error',
          message:
            'This Yes/No field was deleted, please select another Yes/No field',
        }}
      />
    )
  }
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

  return (
    <Stack>
      <Text textStyle="subhead-3">Approvals</Text>
      <Stack direction="column" spacing="0.25rem">
        <ApprovalStepBadge
          isDeleted={Boolean(step.approval_field && !approvalFormField)}
          approvalFormField={approvalFormField}
        />
      </Stack>
    </Stack>
  )
}
