import { useTranslation } from 'react-i18next'
import { Stack, Text } from '@chakra-ui/react'
import { Dictionary } from 'lodash'

import { FormField, FormWorkflowStepDto } from 'formsg-shared/types'

import { workflowNs } from '~/i18n/locales/features/admin-form/sidebar/workflow'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { FormFieldWithQuestionNo } from '~features/form/types'

import { useWorkflowSurfaces } from '../../../hooks/useWorkflowSurfaces'

interface ApprovalStepBadgeProps {
  approvalFormField?: FormFieldWithQuestionNo<FormField>
  isDeleted?: boolean
}

const ApprovalStepBadge = ({
  approvalFormField,
  isDeleted = false,
}: ApprovalStepBadgeProps): JSX.Element | null => {
  const { t } = useTranslation(workflowNs)
  if (isDeleted) {
    return (
      <FieldLogicBadge
        defaults={{
          variant: 'error',
          message: t('approvals.yesNoDeleted'),
        }}
      />
    )
  }
  if (!approvalFormField) {
    return (
      <FieldLogicBadge
        defaults={{
          variant: 'info',
          message: t('approvals.notRequired'),
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
  const { t } = useTranslation(workflowNs)
  const { sectionLabelTextStyle } = useWorkflowSurfaces()
  const approvalFormField = step.approval_field
    ? idToFieldMap[step.approval_field]
    : undefined

  return (
    <Stack>
      <Text textStyle={sectionLabelTextStyle}>{t('approvals.title')}</Text>
      <Stack direction="column" spacing="0.25rem">
        <ApprovalStepBadge
          isDeleted={Boolean(step.approval_field && !approvalFormField)}
          approvalFormField={approvalFormField}
        />
      </Stack>
    </Stack>
  )
}
