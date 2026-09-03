import { useTranslation } from 'react-i18next'
import { BiPencil } from 'react-icons/bi'
import {
  Box,
  chakra,
  Flex,
  Icon,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'

import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'

import {
  formatEmailFieldLabel,
  formatNotifiedStepLabel,
} from './utils/completionEmailLabels'
import { CompletionEmailRecipients } from './utils/getCompletionEmailRecipients'
import { CompletionEmailLabel } from './CompletionEmailLabel'

const PREFIX =
  'features.adminForm.settings.emailNotifications.section.mrf.respondents'

export interface InactiveCompletionEmailCardProps {
  /**
   * Null while the settings query is still in flight. Required rather than
   * optional so that omitting it is a type error instead of a card that
   * skeletons forever.
   *
   * A failed query is not this component's to represent: the caller renders the
   * flag-off message instead of the card, so null here only ever means loading.
   */
  recipients: CompletionEmailRecipients | null
  onClick: () => void
}

/**
 * Collapsed completion email card: a summary of who gets notified, or an
 * instruction to pick someone when nothing is configured yet.
 *
 * Chrome matches InactiveStepBlock exactly, including the pencil being a
 * hover-only affordance rather than a control of its own.
 */
export const InactiveCompletionEmailCard = ({
  recipients,
  onClick,
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
            ? [formatEmailFieldLabel(recipients.stepOneField)]
            : [],
        },
        {
          id: 'stepN',
          label: t(`${PREFIX}.stepN.label.overallRedesign`),
          values: recipients.notifiedSteps.map((step) =>
            formatNotifiedStepLabel(t, step),
          ),
        },
      ].filter(({ values }) => values.length > 0)
    : []

  return (
    <Box pos="relative" role="group">
      <chakra.button
        type="button"
        w="100%"
        textAlign="start"
        borderRadius="4px"
        bg="white"
        border="1px solid"
        borderColor="neutral.300"
        transitionProperty="common"
        transitionDuration="normal"
        cursor="pointer"
        _groupHover={{ borderColor: 'primary.500', bg: 'primary.100' }}
        onClick={onClick}
      >
        <Stack spacing="1.5rem" p={{ base: '1.5rem', md: '2rem' }}>
          <CompletionEmailLabel />

          {!recipients ? (
            // Settings arrive after the form, so the card holds its frame and
            // label rather than the whole block appearing late. Sized bars
            // rather than a <Skeleton isLoaded> wrapper because the loaded
            // content has two different shapes, and neither is honest to size a
            // placeholder against.
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
                // Bare Stack, so the label-to-chips gap is Chakra's 0.5rem
                // default, the same as InactiveStepBlock's respondent block.
                <Stack key={id}>
                  <Text textStyle="subhead-3">{label}</Text>
                  {/* Chip row copied from InactiveStepBlock's respondent badges
                      rather than approximated, so both cards lay recipients out
                      identically. Values are unique within a group: emails are
                      deduplicated in the helper, step labels carry their step
                      number, and step 1 is a single value. */}
                  <Flex
                    flexDir={{ base: 'column', md: 'row' }}
                    gap={{ base: '0.5rem', md: '1rem' }}
                    rowGap={{ md: '0.5rem' }}
                    wrap="wrap"
                  >
                    {values.map((value) => (
                      <LogicBadge key={value}>{value}</LogicBadge>
                    ))}
                  </Flex>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </chakra.button>
      {/* The whole card is the button, so the pencil is a visual affordance
      only: no click target, no tab stop, hidden from AT. It reacts to hover on
      the card via the wrapper's role="group". */}
      <Icon
        as={BiPencil}
        aria-hidden
        pointerEvents="none"
        top={{ base: '0.5rem', md: '2rem' }}
        right={{ base: '0.5rem', md: '2rem' }}
        pos="absolute"
        fontSize="1.5rem"
        color="neutral.500"
        transitionProperty="common"
        transitionDuration="normal"
        _groupHover={{ color: 'primary.500' }}
      />
    </Box>
  )
}
