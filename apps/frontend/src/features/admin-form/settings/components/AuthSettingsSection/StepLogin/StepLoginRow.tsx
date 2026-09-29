import { useTranslation } from 'react-i18next'
import { Box, Divider, Flex, Stack, Text } from '@chakra-ui/react'

import {
  AdminMultirespondentFormDto,
  FormWorkflowStepDto,
  WorkflowType,
} from 'formsg-shared/types'
import { ResolvedStepAuth } from 'formsg-shared/utils/workflow-auth'

import Button from '~components/Button'

import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'

import { StepLoginEditor } from './StepLoginEditor'
import { STEP_LOGIN_COPY_KEY, useStepLoginLabels } from './useStepLoginLabels'

interface StepLoginRowProps {
  form: AdminMultirespondentFormDto
  stepIndex: number
  saved: ResolvedStepAuth
  isEditing: boolean
  canEdit: boolean
  onEdit: () => void
  onClose: () => void
}

// One step in Settings › Singpass: who fills it, its saved login, and an inline editor.
export const StepLoginRow = ({
  form,
  stepIndex,
  saved,
  isEditing,
  canEdit,
  onEdit,
  onClose,
}: StepLoginRowProps): JSX.Element => {
  const { t } = useTranslation()
  const { getTypeLabel, getCheckLabels } = useStepLoginLabels()
  const step = form.workflow[stepIndex] as FormWorkflowStepDto | undefined
  const stepNumber = stepIndex + 1

  const titleOf = (fieldId: string) =>
    form.form_fields.find((field) => field._id === fieldId)?.title ??
    t(`${STEP_LOGIN_COPY_KEY}.deletedField`)
  const respondent = (() => {
    if (stepIndex === 0 || !step)
      return t(`${STEP_LOGIN_COPY_KEY}.anyoneWithLink`)
    switch (step.workflow_type) {
      case WorkflowType.Static:
        return step.emails.join(', ')
      case WorkflowType.Dynamic:
        return t(`${STEP_LOGIN_COPY_KEY}.emailField`, {
          title: titleOf(step.field),
        })
      case WorkflowType.Conditional:
        return t(`${STEP_LOGIN_COPY_KEY}.dropdownOptions`, {
          title: titleOf(step.conditional_field),
        })
    }
  })()

  return (
    <Box
      border="1px solid"
      borderColor={isEditing ? 'primary.500' : 'neutral.300'}
      borderRadius="4px"
      p="1.5rem"
    >
      <Flex justify="space-between" align="flex-start" gap="1rem">
        <Stack spacing="0.5rem" flex={1} minW={0}>
          <Text textStyle="subhead-1" color="secondary.700">
            {step?.step_name
              ? t(`${STEP_LOGIN_COPY_KEY}.namedStepTitle`, {
                  stepNumber,
                  stepName: step.step_name,
                })
              : t(`${STEP_LOGIN_COPY_KEY}.stepTitle`, { stepNumber })}
          </Text>
          <Text textStyle="caption-1" color="secondary.400">
            {respondent}
          </Text>
          <Flex gap="0.5rem" wrap="wrap">
            <LogicBadge>{getTypeLabel(saved.authType)}</LogicBadge>
            {getCheckLabels(saved).map((label) => (
              <LogicBadge key={label}>{label}</LogicBadge>
            ))}
          </Flex>
        </Stack>
        {isEditing ? null : (
          <Button
            flexShrink={0}
            variant="outline"
            onClick={onEdit}
            isDisabled={!canEdit}
            aria-label={t(`${STEP_LOGIN_COPY_KEY}.editAriaLabel`, {
              stepNumber,
            })}
          >
            {t(`${STEP_LOGIN_COPY_KEY}.edit`)}
          </Button>
        )}
      </Flex>
      {isEditing ? (
        <>
          <Divider my="1.5rem" />
          <StepLoginEditor
            form={form}
            stepIndex={stepIndex}
            saved={saved}
            onClose={onClose}
          />
        </>
      ) : null}
    </Box>
  )
}
