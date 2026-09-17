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

import { useWorkflowSurfaces } from '../../hooks/useWorkflowSurfaces'

import {
  formatEmailFieldLabel,
  formatNotifiedStepLabel,
} from './utils/completionEmailLabels'
import { CompletionEmailRecipients } from './utils/getCompletionEmailRecipients'
import { CompletionEmailLabel } from './CompletionEmailLabel'

const PREFIX =
  'features.adminForm.settings.emailNotifications.section.mrf.respondents'

export interface InactiveCompletionEmailCardProps {
  recipients: CompletionEmailRecipients | null
  onClick: () => void
}

export const InactiveCompletionEmailCard = ({
  recipients,
  onClick,
}: InactiveCompletionEmailCardProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    cardRadius,
    sectionLabelTextStyle,
    iconRestColor,
    iconTransitionDuration,
  } = useWorkflowSurfaces()

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
    <Box pos="relative" zIndex={1} role="group">
      <chakra.button
        type="button"
        w="100%"
        textAlign="start"
        borderRadius={cardRadius}
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
            <Stack spacing="0.25rem">
              <Skeleton h="1.5rem" w="60%" />
              <Skeleton h="1.5rem" w="40%" />
            </Stack>
          ) : recipients.isEmpty ? (
            <Text color="secondary.400">
              {t(
                'features.adminForm.settings.emailNotifications.section.mrf.selectRecipientWorkflow',
              )}
            </Text>
          ) : (
            <Stack spacing="1.5rem">
              {groups.map(({ id, label, values }) => (
                <Stack key={id}>
                  <Text textStyle={sectionLabelTextStyle}>{label}</Text>
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
      <Icon
        as={BiPencil}
        aria-hidden
        pointerEvents="none"
        top={{ base: '0.5rem', md: '2rem' }}
        right={{ base: '0.5rem', md: '2rem' }}
        pos="absolute"
        fontSize="1.5rem"
        color={iconRestColor}
        transitionProperty="common"
        transitionDuration={iconTransitionDuration}
        _groupHover={{ color: 'primary.500' }}
      />
    </Box>
  )
}
