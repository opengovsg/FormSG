import { useTranslation } from 'react-i18next'
import { IconType } from 'react-icons'
import {
  BiBell,
  BiCheck,
  BiFile,
  BiSend,
  BiStopCircle,
  BiUserPlus,
  BiX,
} from 'react-icons/bi'
import { Box, Stack, Text } from '@chakra-ui/react'
import { formatInTimeZone } from 'date-fns-tz'

import {
  WorkflowEventType,
  WorkflowStatus,
  WorkflowStepAuthType,
} from 'formsg-shared/types'
import { STEP_LOGIN_PROVIDER_LABELS } from 'formsg-shared/utils/step-login'

import type { ResponsesIndividualResponse } from '~/i18n/locales/features/admin-form/responses/individual-response'

import { Tag } from '~components/Tag'

import { formatEmailList } from './formatEmailList'
import { WorkflowHistory } from './getStopNotifiedEmails'
import { WORKFLOW_ACTIONS_I18N } from './i18n'

const I18N_PREFIX = `${WORKFLOW_ACTIONS_I18N}.activityLog` as const
type ActivityLogKey =
  keyof ResponsesIndividualResponse['workflowActions']['activityLog']
interface ActivityEntry {
  id: string
  at: string
  title: string
  icon: IconType
  notificationRecipients?: string[]
  // The provider verified for a submitted step, never today's workflow setting
  authType?: WorkflowStepAuthType
}

export const WorkflowActivityLog = ({
  history = { submittedSteps: [], workflow: [] },
}: {
  history?: WorkflowHistory
}): JSX.Element => {
  const { t } = useTranslation()
  const { submittedSteps, workflow, workflowEvents: events = [] } = history
  const stepValues = (stepNumber: number) => {
    const name = workflow[stepNumber - 1]?.step_name?.trim()
    return {
      step: t(`${I18N_PREFIX}.stepNumber`, { stepNumber }),
      stepName: name ? t(`${I18N_PREFIX}.stepNameLabel`, { name }) : '',
    }
  }
  const entry = (
    id: string,
    at: string,
    key: ActivityLogKey,
    values: Record<string, string>,
    icon: IconType,
  ): ActivityEntry => ({
    id,
    at,
    title: t(`${I18N_PREFIX}.${key}`, values),
    icon,
  })

  // Sort source records before expanding them, so equal-time action/sending
  // pairs stay adjacent and preserve the existing submitted-steps-first order.
  const stepGroups = submittedSteps.map((step, index) => {
    const id = `step-${index}`
    const recipients =
      'nextStepRecipientEmails' in step
        ? (step.nextStepRecipientEmails ?? [])
        : []
    const status = 'status' in step ? step.status : undefined
    const rejected = status === WorkflowStatus.REJECTED
    const approved = status === WorkflowStatus.APPROVED
    const entries: ActivityEntry[] = [
      {
        ...entry(
          id,
          step.submittedAt,
          rejected
            ? 'stepRejected'
            : approved
              ? 'stepApproved'
              : index === 0
                ? 'submitted'
                : 'stepSubmitted',
          stepValues(index + 1),
          rejected ? BiX : approved ? BiCheck : BiFile,
        ),
        authType: step.authType,
      },
    ]
    if (!rejected && index < workflow.length - 1 && recipients.length) {
      entries.push(
        entry(
          `${id}-sent`,
          step.submittedAt,
          'stepSent',
          {
            ...stepValues(index + 2),
            recipients: formatEmailList(recipients),
          },
          BiSend,
        ),
      )
    }
    return { at: step.submittedAt, entries }
  })
  const eventGroups = events.map((event, index) => {
    const id = `event-${index}`
    const actor = event.actorEmail
      ? t(`${I18N_PREFIX}.actorClause`, { actor: event.actorEmail })
      : ''
    let entries: ActivityEntry[]
    switch (event.type) {
      case WorkflowEventType.AssigneesAdded:
        entries = [
          entry(
            id,
            event.created,
            'assigneeAdded',
            {
              ...stepValues(event.stepNumber),
              emails: formatEmailList(event.emails),
              actor,
            },
            BiUserPlus,
          ),
        ]
        break
      case WorkflowEventType.ReminderSent:
        entries = [
          entry(
            id,
            event.created,
            'reminderTriggered',
            { ...stepValues(event.stepNumber), actor },
            BiBell,
          ),
        ]
        if (event.emails.length) {
          entries.push(
            entry(
              `${id}-sent`,
              event.created,
              'reminderSent',
              {
                ...stepValues(event.stepNumber),
                recipients: formatEmailList(event.emails),
              },
              BiSend,
            ),
          )
        }
        break
      case WorkflowEventType.Stopped:
        entries = [
          {
            ...entry(id, event.created, 'stopped', { actor }, BiStopCircle),
            notificationRecipients: event.emails,
          },
        ]
        break
    }
    return { at: event.created, entries }
  })
  const entries = [...stepGroups, ...eventGroups]
    .sort((a, b) => a.at.localeCompare(b.at))
    .flatMap((group) => group.entries)

  return (
    <Box
      as="ol"
      listStyleType="none"
      m={0}
      p={0}
      pb="2.5rem"
      aria-label={t(`${I18N_PREFIX}.title`)}
      data-dd-privacy="mask"
    >
      {entries.map(
        (
          { id, at, title, icon: EventIcon, notificationRecipients, authType },
          index,
        ) => (
          <Box
            as="li"
            key={id}
            position="relative"
            pb={index === entries.length - 1 ? 0 : '2rem'}
          >
            {index !== entries.length - 1 && (
              <Box
                position="absolute"
                left="15px"
                top="1rem"
                bottom="-1rem"
                w="2px"
                bg="neutral.300"
                aria-hidden
              />
            )}
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
            <Stack ml="3rem" spacing="0.75rem" minW={0}>
              <Box>
                <Text
                  as="h3"
                  textStyle="subhead-1"
                  pt="0.125rem"
                  overflowWrap="anywhere"
                >
                  {title}
                </Text>
                {authType && (
                  <Tag mt="0.25rem" colorScheme="secondary">
                    {STEP_LOGIN_PROVIDER_LABELS[authType]}
                  </Tag>
                )}
                <Text
                  as="time"
                  dateTime={at}
                  display="block"
                  textStyle="body-2"
                  color="secondary.400"
                  mt="0.25rem"
                >
                  {formatInTimeZone(
                    new Date(at),
                    'Asia/Singapore',
                    'EEE, d MMM yyyy, hh:mm:ss a',
                  )}
                </Text>
              </Box>
              {!!notificationRecipients?.length && (
                <Box bg="secondary.100" p="1rem" borderRadius="8px">
                  <Text textStyle="subhead-2" mb="0.25rem">
                    {t(`${I18N_PREFIX}.notificationRecipients`)}
                  </Text>
                  <Text textStyle="body-2" overflowWrap="anywhere">
                    {formatEmailList(notificationRecipients)}
                  </Text>
                </Box>
              )}
            </Stack>
          </Box>
        ),
      )}
    </Box>
  )
}
