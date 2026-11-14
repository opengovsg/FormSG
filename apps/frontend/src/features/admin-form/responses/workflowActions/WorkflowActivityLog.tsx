import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconType } from 'react-icons'
import {
  BiBell,
  BiCheck,
  BiFile,
  BiStopCircle,
  BiUndo,
  BiUserPlus,
  BiX,
} from 'react-icons/bi'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { formatInTimeZone } from 'date-fns-tz'

import {
  AdminWorkflowEventDto,
  StepSubmittedEventDto,
  WorkflowEventDto,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'

import type { ResponsesIndividualResponse } from '~/i18n/locales/features/admin-form/responses/individual-response'

import { Tag } from '~components/Tag'

import { WorkflowHistory } from './getStopNotifiedEmails'
import { WORKFLOW_ACTIONS_I18N } from './i18n'

const I18N_PREFIX = `${WORKFLOW_ACTIONS_I18N}.activityLog` as const
type ActivityLogKey =
  keyof ResponsesIndividualResponse['workflowActions']['activityLog']
interface ActivityDetail {
  heading: string
  emails?: string[]
  body?: string
}
interface ActivityEntry {
  id: string
  at: string
  title: string
  icon: IconType
  actorEmail?: string
  details: ActivityDetail[]
}
interface ActivityGroup {
  at: string
  isStep: boolean
  stepNumber: number
  entry: ActivityEntry
}
interface StepRecord {
  stepNumber: number
  at: string
  outcome?: WorkflowStatus
  recipients: string[]
}
const isStepSubmittedEvent = (
  event: WorkflowEventDto,
): event is StepSubmittedEventDto =>
  event.type === WorkflowEventType.StepSubmitted
const isAdminWorkflowEvent = (
  event: WorkflowEventDto,
): event is AdminWorkflowEventDto => !isStepSubmittedEvent(event)

const EmailTags = ({ emails }: { emails: string[] }) => (
  <Flex gap="0.5rem" flexWrap="wrap" minW={0} maxW="100%">
    {emails.map((email, index) => (
      <Tag
        key={`${email}-${index}`}
        maxW="100%"
        overflowWrap="anywhere"
        whiteSpace="normal"
      >
        {email}
      </Tag>
    ))}
  </Flex>
)

export const WorkflowActivityLog = ({
  history = { submittedSteps: [], workflow: [] },
  currentState,
}: {
  history?: WorkflowHistory
  currentState?: ReactNode
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
    details: [],
  })
  const stepGroup = (
    { stepNumber, at, outcome, recipients }: StepRecord,
    id: string,
  ): ActivityGroup => {
    const rejected = outcome === WorkflowStatus.REJECTED
    const approved = outcome === WorkflowStatus.APPROVED
    const activity = entry(
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
    )
    if (!rejected && stepNumber < workflow.length && recipients.length) {
      activity.details.push({
        heading: t(
          `${I18N_PREFIX}.nextStepRecipients`,
          stepValues(stepNumber + 1),
        ),
        emails: recipients,
      })
    }
    return { at, isStep: true, stepNumber, entry: activity }
  }
  const stepSubmittedEvents = events.filter(isStepSubmittedEvent)
  const recordedStepNumbers = new Set(
    stepSubmittedEvents.map(({ stepNumber }) => stepNumber),
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
      recordedStepNumbers.has(index + 1)
        ? []
        : [
            stepGroup(
              {
                stepNumber: index + 1,
                at: step.submittedAt,
                outcome: 'status' in step ? step.status : undefined,
                recipients:
                  'nextStepRecipientEmails' in step
                    ? (step.nextStepRecipientEmails ?? [])
                    : [],
              },
              `step-${index}`,
            ),
          ],
    ),
  ]
  const eventGroups = events
    .filter(isAdminWorkflowEvent)
    .flatMap((event, index): ActivityGroup[] => {
      const id = `event-${index}`
      let activity: ActivityEntry
      switch (event.type) {
        case WorkflowEventType.AssigneesAdded:
          activity = entry(
            id,
            event.created,
            'assigneeAdded',
            stepValues(event.stepNumber),
            BiUserPlus,
          )
          if (event.emails.length)
            activity.details.push({
              heading: t(`${I18N_PREFIX}.addedAssignees`),
              emails: event.emails,
            })
          break
        case WorkflowEventType.ReminderSent:
          activity = entry(
            id,
            event.created,
            'reminderTriggered',
            stepValues(event.stepNumber),
            BiBell,
          )
          if (event.emails.length)
            activity.details.push({
              heading: t(`${I18N_PREFIX}.reminderRecipients`),
              emails: event.emails,
            })
          break
        case WorkflowEventType.Stopped:
          activity = entry(id, event.created, 'stopped', {}, BiStopCircle)
          if (event.emails.length)
            activity.details.push({
              heading: t(`${I18N_PREFIX}.notificationRecipients`),
              emails: event.emails,
            })
          break
        case WorkflowEventType.SentBack:
        case WorkflowEventType.FixStep:
          activity = entry(
            id,
            event.created,
            event.type === WorkflowEventType.FixStep ? 'fixStep' : 'sentBack',
            {},
            BiUndo,
          )
          activity.details.push({
            heading: t(
              `${I18N_PREFIX}.${event.emails.length ? 'sentBackRecipients' : 'sentBackTarget'}`,
              stepValues(event.stepNumber),
            ),
            emails: event.emails.length ? event.emails : undefined,
          })
          if (event.remarks?.trim())
            activity.details.push({
              heading: t(`${I18N_PREFIX}.remarks`),
              body: event.remarks,
            })
          break
        default:
          return []
      }
      activity.actorEmail = event.actorEmail || undefined
      return [
        {
          at: event.created,
          isStep: false,
          stepNumber: event.stepNumber,
          entry: activity,
        },
      ]
    })
  // Sort source actions without collapsing repeated submissions or equal-time events.
  const entries = [...stepGroups, ...eventGroups]
    .sort(
      (a, b) =>
        Date.parse(a.at) - Date.parse(b.at) ||
        Number(b.isStep) - Number(a.isStep) ||
        a.stepNumber - b.stepNumber,
    )
    .map((group) => group.entry)

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
        ({ id, at, title, icon: EventIcon, actorEmail, details }, index) => {
          const hasNext = index !== entries.length - 1 || !!currentState
          return (
            <Box as="li" key={id} position="relative" pb={hasNext ? '2rem' : 0}>
              {hasNext && (
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
                  <Flex
                    align="center"
                    flexWrap="wrap"
                    gap="0.5rem"
                    mt="0.25rem"
                    textStyle="body-2"
                    color="secondary.400"
                  >
                    {actorEmail && (
                      <>
                        <EmailTags emails={[actorEmail]} />
                        <Text as="span">{t(`${I18N_PREFIX}.formAdmin`)}</Text>
                        <Text as="span" aria-hidden>
                          ·
                        </Text>
                      </>
                    )}
                    <Text as="time" dateTime={at} textStyle="body-2">
                      {formatInTimeZone(
                        new Date(at),
                        'Asia/Singapore',
                        'EEE, d MMM yyyy, hh:mm:ss a',
                      )}
                    </Text>
                  </Flex>
                </Box>
                {details.map(({ heading, emails, body }, detailIndex) => (
                  <Box
                    key={detailIndex}
                    bg="secondary.100"
                    p="1rem"
                    borderRadius="8px"
                  >
                    <Text
                      textStyle="subhead-2"
                      mb={emails || body ? '0.25rem' : 0}
                    >
                      {heading}
                    </Text>
                    {emails && <EmailTags emails={emails} />}
                    {body && (
                      <Text
                        textStyle="body-2"
                        whiteSpace="pre-wrap"
                        overflowWrap="anywhere"
                      >
                        {body}
                      </Text>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          )
        },
      )}
      {currentState}
    </Box>
  )
}
