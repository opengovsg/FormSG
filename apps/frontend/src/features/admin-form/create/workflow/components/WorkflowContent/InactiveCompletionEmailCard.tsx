import { useTranslation } from 'react-i18next'
import { Box, Stack, Text } from '@chakra-ui/react'

import { CompletionEmailRecipients } from './utils/getCompletionEmailRecipients'
import { CompletionEmailLabel } from './CompletionEmailLabel'

const PREFIX =
  'features.adminForm.settings.emailNotifications.section.mrf.respondents'

export interface InactiveCompletionEmailCardProps {
  recipients: CompletionEmailRecipients
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
  const { otherParties, stepOneField, notifiedSteps, isEmpty } = recipients

  // One group per control in the expanded card, same order, same labels, so the
  // two views cannot describe the same settings differently. Every label is
  // Settings' own string; none of this copy is new.
  const groups = [
    { label: t(`${PREFIX}.others.label`), values: otherParties },
    {
      label: t(`${PREFIX}.step1.label`),
      values: stepOneField
        ? [
            stepOneField.questionNumber
              ? `${stepOneField.questionNumber}. ${stepOneField.title}`
              : stepOneField.title,
          ]
        : [],
    },
    {
      label: t(`${PREFIX}.stepN.label.overallRedesign`),
      values: notifiedSteps.map(
        ({ stepNumber, stepName }) =>
          t(`${PREFIX}.stepN.label.each`, { stepNumber }) +
          (stepName ? ` (${stepName})` : ''),
      ),
    },
  ].filter(({ values }) => values.length > 0)

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

        {isEmpty ? (
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
            {groups.map(({ label, values }) => (
              <Stack key={label} spacing="0.25rem">
                <Text textStyle="subhead-3">{label}</Text>
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
