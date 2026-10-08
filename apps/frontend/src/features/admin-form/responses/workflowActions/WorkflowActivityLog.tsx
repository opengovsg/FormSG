import { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Circle, Flex, Stack, Text } from '@chakra-ui/react'
import { formatInTimeZone } from 'date-fns-tz'

import { WorkflowEventType, WorkflowStatus } from 'formsg-shared/types'

import type { ResponsesIndividualResponse } from '~/i18n/locales/features/admin-form/responses/individual-response'

import { formatEmailList } from './formatEmailList'
import { WorkflowHistory } from './getStopNotifiedEmails'
import { WORKFLOW_ACTIONS_I18N } from './i18n'
import { useWorkflowEvents } from './queries'

const I18N_PREFIX = `${WORKFLOW_ACTIONS_I18N}.activityLog` as const
const BOLD = { bold: <Text as="b" /> }

type ActivityLogKey =
  keyof ResponsesIndividualResponse['workflowActions']['activityLog']

const formatActivityTimestamp = (iso: string): string =>
  formatInTimeZone(
    new Date(iso),
    'Asia/Singapore',
    'EEE, d MMM yyyy, hh:mm:ss a',
  )

interface ActivityEntry {
  at: string
  title: ReactNode
  isStop?: boolean
}

const ActivityLogEntry = ({
  title,
  timestamp,
  isStop,
}: {
  title: ReactNode
  timestamp: string
  isStop?: boolean
}) => (
  <Flex gap="0.75rem" align="flex-start">
    <Circle
      size="0.5rem"
      mt="0.5rem"
      flexShrink={0}
      bg={isStop ? 'danger.500' : 'neutral.400'}
    />
    <Stack spacing="0.125rem">
      <Text textStyle="body-2" color="secondary.700">
        {title}
      </Text>
      <Text textStyle="caption-1" color="secondary.400">
        {timestamp}
      </Text>
    </Stack>
  </Flex>
)

export const WorkflowActivityLog = ({
  submissionId,
  history = { submittedSteps: [], workflow: [] },
}: {
  submissionId: string
  history?: WorkflowHistory
}): JSX.Element => {
  const { t } = useTranslation()
  const { formId = '' } = useParams()
  const { data: events = [] } = useWorkflowEvents({
    formId,
    submissionId,
    enabled: true,
  })
  const { submittedSteps, workflow } = history

  const stepValues = (stepNumber: number) => {
    const name = workflow[stepNumber - 1]?.step_name?.trim()
    return {
      step: t(`${I18N_PREFIX}.stepNumber`, { stepNumber }),
      stepName: name ? t(`${I18N_PREFIX}.stepNameLabel`, { name }) : '',
    }
  }

  const entry = (
    at: string,
    key: ActivityLogKey,
    values: Record<string, string>,
    isStop?: boolean,
  ): ActivityEntry => ({
    at,
    isStop,
    title: (
      <Trans
        i18nKey={`${I18N_PREFIX}.${key}`}
        values={values}
        components={BOLD}
      />
    ),
  })

  const stepEntries = submittedSteps.map((step, index) => {
    const recipients =
      'nextStepRecipientEmails' in step
        ? (step.nextStepRecipientEmails ?? [])
        : []
    const sentTo = index < workflow.length - 1 && recipients.length > 0
    const status = 'status' in step ? step.status : undefined
    const key: ActivityLogKey =
      status === WorkflowStatus.REJECTED
        ? 'stepNotApproved'
        : status === WorkflowStatus.APPROVED
          ? sentTo
            ? 'stepApprovedSentTo'
            : 'stepApproved'
          : sentTo
            ? 'stepCompletedSentTo'
            : 'stepCompleted'
    return entry(step.submittedAt, key, {
      ...stepValues(index + 1),
      recipients: formatEmailList(recipients),
    })
  })

  const eventEntries = events.map((event) => {
    switch (event.type) {
      case WorkflowEventType.AssigneesAdded:
        return entry(event.created, 'assigneeAdded', {
          emails: formatEmailList(event.emails),
          ...stepValues(event.stepNumber),
          actor: event.actorEmail,
        })
      case WorkflowEventType.ReminderSent:
        return entry(event.created, 'reminderSent', {
          recipients: formatEmailList(event.emails),
          actor: event.actorEmail,
        })
      case WorkflowEventType.Stopped:
        return entry(
          event.created,
          'stopped',
          { actor: event.actorEmail },
          true,
        )
    }
  })

  const entries = [...stepEntries, ...eventEntries].sort((a, b) =>
    a.at.localeCompare(b.at),
  )

  return (
    <Stack spacing="1rem" data-dd-privacy="mask">
      <Text textStyle="subhead-1" color="secondary.700">
        {t(`${I18N_PREFIX}.title`)}
      </Text>
      <Stack spacing="1rem">
        {entries.map(({ at, title, isStop }, index) => (
          <ActivityLogEntry
            key={`${at}-${index}`}
            title={title}
            timestamp={formatActivityTimestamp(at)}
            isStop={isStop}
          />
        ))}
      </Stack>
    </Stack>
  )
}
