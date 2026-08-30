import { useTranslation } from 'react-i18next'
import { Box, Skeleton, Stack, Text } from '@chakra-ui/react'

import { CompletionEmailRecipients } from './utils/getCompletionEmailRecipients'
import { CompletionEmailLabel } from './CompletionEmailLabel'

const PREFIX =
  'features.adminForm.settings.emailNotifications.section.mrf.respondents'

export interface InactiveCompletionEmailCardProps {
  /**
   * Null while the settings query is still in flight. Required rather than
   * optional so that omitting it is a type error instead of a card that
   * skeletons forever.
   */
  recipients: CompletionEmailRecipients | null
}

/**
 * Collapsed completion email card: a summary of who gets notified, or an
 * instruction to pick someone when nothing is configured yet.
 *
 * Read-only for now. Chrome matches InactiveStepBlock's resting state; the
 * click target, hover affordance and pencil arrive with the editable card.
 */
export const InactiveCompletionEmailCard = ({
  recipients,
}: InactiveCompletionEmailCardProps): JSX.Element => {
  const { t } = useTranslation()

  // One group per control in the expanded card, same order, same labels, so the
  // two views cannot describe the same settings differently. Every label is
  // Settings' own string; none of this copy is new.
  //
  // Keyed on `id` rather than `label`: labels are translated, so they are not
  // ours to guarantee unique.
  const groups = recipients
    ? [
        {
          id: 'others',
          label: t(`${PREFIX}.others.label`),
          values: recipients.otherParties,
        },
        {
          id: 'step1',
          label: t(`${PREFIX}.step1.label`),
          values: recipients.stepOneField
            ? [
                recipients.stepOneField.questionNumber
                  ? `${recipients.stepOneField.questionNumber}. ${recipients.stepOneField.title}`
                  : recipients.stepOneField.title,
              ]
            : [],
        },
        {
          id: 'stepN',
          label: t(`${PREFIX}.stepN.label.overallRedesign`),
          values: recipients.notifiedSteps.map(
            ({ stepNumber, stepName }) =>
              t(`${PREFIX}.stepN.label.each`, { stepNumber }) +
              (stepName ? ` (${stepName})` : ''),
          ),
        },
      ].filter(({ values }) => values.length > 0)
    : []

  return (
    <Box
      w="100%"
      borderRadius="4px"
      bg="white"
      border="1px solid"
      borderColor="neutral.300"
      transitionProperty="common"
      transitionDuration="normal"
    >
      <Stack spacing="1.5rem" p={{ base: '1.5rem', md: '2rem' }}>
        <CompletionEmailLabel />

        {!recipients ? (
          // Settings arrive after the form, so the card holds its frame and
          // label rather than the whole block appearing late. Sized bars rather
          // than a <Skeleton isLoaded> wrapper because the loaded content has
          // two different shapes, and neither is honest to size a placeholder
          // against.
          <Stack spacing="0.25rem">
            <Skeleton h="1.5rem" w="60%" />
            <Skeleton h="1.5rem" w="40%" />
          </Stack>
        ) : recipients.isEmpty ? (
          // Reuses the Settings instruction rather than an absence message:
          // this is the state every new form starts in, so it should tell the
          // admin what to do next.
          <Text color="secondary.400">
            {t(
              'features.adminForm.settings.emailNotifications.section.mrf.selectRecipientWorkflow',
            )}
          </Text>
        ) : (
          <Stack spacing="1.5rem">
            {groups.map(({ id, label, values }) => (
              <Stack key={id} spacing="0.25rem">
                <Text textStyle="subhead-3">{label}</Text>
                {/* Values are unique within a group: emails are deduplicated in
                    the helper, step labels carry their step number, and step 1
                    is a single value. */}
                {values.map((value) => (
                  <Text key={value}>{value}</Text>
                ))}
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
