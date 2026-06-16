import { Stack, Text } from '@chakra-ui/react'
import { Dictionary } from 'lodash'

import { FormField, FormWorkflowStepDto } from 'formsg-shared/types'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'
import { FormFieldWithQuestionNo } from '~features/form/types'

interface InactiveWhatTheyDoBlockProps {
  step: FormWorkflowStepDto
  idToFieldMap: Dictionary<FormFieldWithQuestionNo<FormField>>
}

export const InactiveWhatTheyDoBlock = ({
  step,
  idToFieldMap,
}: InactiveWhatTheyDoBlockProps) => {
  const hasApprovalField = !!step.approval_field
  const approvalFormField = step.approval_field
    ? idToFieldMap[step.approval_field]
    : undefined
  const isApprovalFieldDeleted = hasApprovalField && !approvalFormField

  return (
    <Stack>
      <Text textStyle="subhead-3">What they do</Text>
      <Stack direction="column" spacing="0.25rem">
        {hasApprovalField ? (
          <>
            <LogicBadge>Fill up fields and approve</LogicBadge>
            {isApprovalFieldDeleted ? (
              <FieldLogicBadge
                defaults={{
                  variant: 'error',
                  message:
                    'The Yes/No field was deleted, please select another field',
                }}
              />
            ) : (
              <FieldLogicBadge field={approvalFormField} />
            )}
          </>
        ) : (
          <LogicBadge>Fill up fields only</LogicBadge>
        )}
      </Stack>
    </Stack>
  )
}
