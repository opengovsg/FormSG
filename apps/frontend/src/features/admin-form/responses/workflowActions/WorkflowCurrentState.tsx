import { ReactNode, Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { BiCheck, BiRadioCircleMarked, BiStopCircle, BiX } from 'react-icons/bi'
import { Box, Flex, Text } from '@chakra-ui/react'

import { SubmissionMrfMetadata, WorkflowStatus } from 'formsg-shared/types'

import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'

import { getCurrentStepRecipients } from './getCurrentStepRecipients'
import { WorkflowHistory } from './getStopNotifiedEmails'
import { WORKFLOW_ACTIONS_I18N } from './i18n'

export interface WorkflowCurrentStateProps {
  mrf: SubmissionMrfMetadata
  history: WorkflowHistory
  actions?: ReactNode
  actionRowRef?: Ref<HTMLDivElement>
  showActions?: boolean
}

export const WorkflowCurrentState = ({
  mrf,
  history,
  actions,
  actionRowRef,
  showActions = true,
}: WorkflowCurrentStateProps): JSX.Element | null => {
  const { t } = useTranslation()
  if (!mrf) return null
  const prefix = `${WORKFLOW_ACTIONS_I18N}.currentState` as const
  const terminal = mrf.stoppedAt
    ? 'voided'
    : mrf.workflowStatus === WorkflowStatus.REJECTED
      ? 'rejected'
      : mrf.workflowStatus === WorkflowStatus.COMPLETED ||
          mrf.workflowStatus === WorkflowStatus.APPROVED
        ? 'completed'
        : undefined
  if (!terminal && mrf.workflowStatus !== WorkflowStatus.PENDING) return null
  const stepNumber = mrf.workflowCurrentStepNumber + 1
  const name = history.workflow[stepNumber - 1]?.step_name?.trim()
  const recipients = terminal
    ? []
    : getCurrentStepRecipients(history, stepNumber)
  const EventIcon =
    terminal === 'voided'
      ? BiStopCircle
      : terminal === 'rejected'
        ? BiX
        : terminal === 'completed'
          ? BiCheck
          : BiRadioCircleMarked
  const hasActions = !terminal && !!actions && showActions
  return (
    <Box
      as="li"
      position="relative"
      listStyleType="none"
      data-dd-privacy="mask"
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        boxSize="2rem"
        bg="secondary.100"
        color="secondary.500"
        borderRadius="full"
        borderWidth="3px"
        borderColor="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
        aria-hidden
      >
        <EventIcon fontSize="1.25rem" />
      </Box>
      <Box ml="3rem" minW={0}>
        <Text
          as="h3"
          textStyle="subhead-1"
          pt="0.125rem"
          overflowWrap="anywhere"
        >
          {terminal
            ? t(`${prefix}.${terminal}`)
            : t(`${prefix}.currentStep`, {
                stepNumber,
                stepName: name ? ` (${name})` : '',
              })}
        </Text>
        {!terminal && (
          <Text textStyle="body-2" color="secondary.400" mt="0.25rem">
            {t(`${prefix}.pending`)}
          </Text>
        )}
        {!terminal && (recipients.length > 0 || hasActions) && (
          <Box
            bg="transparent"
            border="1px solid"
            borderColor="neutral.300"
            borderRadius="8px"
            mt="0.75rem"
            overflow="hidden"
          >
            {recipients.length > 0 && (
              <Box p="1rem">
                <Text textStyle="subhead-2" mb="0.25rem">
                  {t(`${prefix}.assignees`)}
                </Text>
                <Flex gap="0.5rem" flexWrap="wrap">
                  {recipients.map((email) => (
                    <LogicBadge key={email} overflowWrap="anywhere">
                      {email}
                    </LogicBadge>
                  ))}
                </Flex>
              </Box>
            )}
            {hasActions && (
              <Box
                ref={actionRowRef}
                p="1rem"
                borderTopWidth={recipients.length ? '1px' : 0}
                borderColor="neutral.300"
              >
                {actions}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}
