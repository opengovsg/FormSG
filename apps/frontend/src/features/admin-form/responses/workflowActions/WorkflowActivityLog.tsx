import { useTranslation } from 'react-i18next'
import { IconType } from 'react-icons'
import {
  BiBell,
  BiCheck,
  BiFile,
  BiSend,
  BiStopCircle,
  BiUndo,
  BiUserPlus,
  BiX,
} from 'react-icons/bi'
import { Box, Stack, Text } from '@chakra-ui/react'
import { formatInTimeZone } from 'date-fns-tz'

import { WorkflowEventType, WorkflowStatus } from 'formsg-shared/types'
import { isAdminWorkflowEvent } from 'formsg-shared/utils/workflow-event'

import type { ResponsesIndividualResponse } from '~/i18n/locales/features/admin-form/responses/individual-response'

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
  detail?: { heading: string; body: string }
}

interface StepRecord {
  stepNumber: number
  at: string
  outcome?: WorkflowStatus
  recipients: string[]
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

  const stepGroup = (
    { stepNumber, at, outcome, recipients }: StepRecord,
    id: string,
  ) => {
    const rejected = outcome === WorkflowStatus.REJECTED
    const approved = outcome === WorkflowStatus.APPROVED
    const entries = [
      entry(
        id,
        at,
        rejected
          ? 'stepRejected'
          : approved
            ? 'stepApproved'
            : stepNumber === 1
              ? 'submitted'
              : 'stepSubmitted',
        stepValues(stepNumber),
        rejected ? BiX : approved ? BiCheck : BiFile,
      ),
    ]
    if (!rejected && stepNumber < workflow.length && recipients.length) {
      entries.push(
        entry(
          `${id}-sent`,
          at,
          'stepSent',
          {
            ...stepValues(stepNumber + 1),
            recipients: formatEmailList(recipients),
          },
          BiSend,
        ),
      )
    }
    return { at, entries }
  }

  const stepSubmittedEvents = events.filter(
    (event) => event.type === WorkflowEventType.StepSubmitted,
  )
  const isRecordedAsEvent = (stepNumber: number, submittedAt: string) =>
    stepSubmittedEvents.some(
      (event) =>
        event.stepNumber === stepNumber &&
        Date.parse(event.created) === Date.parse(submittedAt),
    )
  const stepGroups = [
    ...stepSubmittedEvents.map((event, index) =>
      stepGroup(
        {
          stepNumber: event.stepNumber,
          at: event.created,
          outcome: event.outcome,
          recipients: event.emails,
        },
        `step-event-${index}`,
      ),
    ),
    ...submittedSteps.flatMap((step, index) =>
      isRecordedAsEvent(index + 1, step.submittedAt)
        ? []
        : [
            stepGroup(
              {
                stepNumber: index + 1,
                at: step.submittedAt,
                outcome: 'status' in step ? step.status : undefined,
                recipients: [],
              },
              `step-${index}`,
            ),
          ],
    ),
  ]
  const eventGroups = events
    .filter(isAdminWorkflowEvent)
    .map((event, index) => {
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
              detail: event.emails.length
                ? {
                    heading: t(`${I18N_PREFIX}.notificationRecipients`),
                    body: formatEmailList(event.emails),
                  }
                : undefined,
            },
          ]
          break
        case WorkflowEventType.SentBack:
          entries = [
            {
              ...entry(
                id,
                event.created,
                'sentBack',
                {
                  fromStepNumber: String(event.fromStepNumber ?? ''),
                  ...stepValues(event.stepNumber),
                  actor,
                },
                BiUndo,
              ),
              detail: event.remarks
                ? { heading: t(`${I18N_PREFIX}.remarks`), body: event.remarks }
                : undefined,
            },
          ]
          if (event.emails.length) {
            entries.push(
              entry(
                `${id}-sent`,
                event.created,
                'stepSent',
                {
                  ...stepValues(event.stepNumber),
                  recipients: formatEmailList(event.emails),
                },
                BiSend,
              ),
            )
          }
          break
      }
      return { at: event.created, entries }
    })
  const entries = [...stepGroups, ...eventGroups]
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
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
      {entries.map(({ id, at, title, icon: EventIcon, detail }, index) => (
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
            {detail && (
              <Box bg="secondary.100" p="1rem" borderRadius="8px">
                <Text textStyle="subhead-2" mb="0.25rem">
                  {detail.heading}
                </Text>
                <Text
                  textStyle="body-2"
                  whiteSpace="pre-wrap"
                  overflowWrap="anywhere"
                >
                  {detail.body}
                </Text>
              </Box>
            )}
          </Stack>
        </Box>
      ))}
    </Box>
  )
}
