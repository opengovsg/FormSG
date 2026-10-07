import { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Circle, Flex, Stack, Text } from '@chakra-ui/react'
import { formatInTimeZone } from 'date-fns-tz'

import { WorkflowStatus } from 'formsg-shared/types'

import type { ResponsesIndividualResponse } from '~/i18n/locales/features/admin-form/responses/individual-response'

import { formatEmailList } from './formatEmailList'
import { WorkflowHistory } from './getStopNotifiedEmails'
import { WORKFLOW_STOP_I18N } from './i18n'
import {
  useWorkflowAssignees,
  useWorkflowReminders,
  useWorkflowStop,
} from './previewStore'

const I18N_PREFIX = `${WORKFLOW_STOP_I18N}.activityLog` as const
const BOLD = { bold: <Text as="b" /> }
const UNKNOWN_ADMIN = '[TBC: admin]'

type ActivityLogKey =
  keyof ResponsesIndividualResponse['workflowStop']['activityLog']

/**
 * Same format as the response's submission timestamp (set by the backend as
 * `ddd, D MMM YYYY, hh:mm:ss A` in Singapore time).
 */
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
  timestamp?: string
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
      {timestamp ? (
        <Text textStyle="caption-1" color="secondary.400">
          {timestamp}
        </Text>
      ) : null}
    </Stack>
  </Flex>
)

/**
 * Step entries come from the submission's step history. Assignees, reminders
 * and the stop come from the design-preview store.
 * TODO(workflow-stop): record those on the backend too.
 */
export const WorkflowActivityLog = ({
  submissionId,
  submissionTime,
  history = { submittedSteps: [], workflow: [] },
}: {
  submissionId: string
  submissionTime?: string
  history?: WorkflowHistory
}): JSX.Element => {
  const { t } = useTranslation()
  const stop = useWorkflowStop(submissionId)
  const reminders = useWorkflowReminders(submissionId)
  const assignees = useWorkflowAssignees(submissionId)
  const { submittedSteps, workflow } = history

  // "Step 2" leads every entry and a custom name follows as a label, because
  // names can be roles ("Approver"), actions ("Approve") or left blank.
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

  // One entry per submitted step: completed, approved or not approved, and
  // who it was sent to next.
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

  const entries = [
    ...stepEntries,
    ...assignees.map(({ addedAt, emails, addedBy, stepNumber }) =>
      entry(addedAt, 'assigneeAdded', {
        emails: formatEmailList(emails),
        ...stepValues(stepNumber),
        actor: addedBy ?? UNKNOWN_ADMIN,
      }),
    ),
    ...reminders.map(({ sentAt, recipients, sentBy }) =>
      entry(sentAt, 'reminderSent', {
        recipients: formatEmailList(recipients),
        actor: sentBy ?? UNKNOWN_ADMIN,
      }),
    ),
    ...(stop
      ? [entry(stop.stoppedAt, 'stopped', { actor: stop.stoppedBy }, true)]
      : []),
  ].sort((a, b) => a.at.localeCompare(b.at))

  return (
    <Stack spacing="1rem" data-dd-privacy="mask">
      <Text textStyle="subhead-1" color="secondary.700">
        {t(`${I18N_PREFIX}.title`)}
      </Text>
      <Stack spacing="1rem">
        {/* Older submissions have no step history: fall back to one line. */}
        {stepEntries.length === 0 ? (
          <ActivityLogEntry
            title={t(`${I18N_PREFIX}.submitted`)}
            timestamp={submissionTime}
          />
        ) : null}
        {entries.map(({ at, title, isStop }, index) => (
          // Several entries can share a timestamp.
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
