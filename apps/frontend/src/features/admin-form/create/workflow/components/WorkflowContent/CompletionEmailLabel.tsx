import { useTranslation } from 'react-i18next'
import { BiEnvelope } from 'react-icons/bi'
import { Flex, Icon, Stack, Text } from '@chakra-ui/react'

/**
 * Header for the completion email card. Mirrors StepLabel's shape so the card
 * sits in the same rhythm as the step cards above it, with an envelope in place
 * of the step number.
 */
export const CompletionEmailLabel = (): JSX.Element => {
  const { t } = useTranslation()
  return (
    <Stack
      direction="row"
      spacing="1.5rem"
      alignItems="center"
      textStyle="subhead-3"
    >
      {/* Measured against StepLabel's number box, which renders 44.51 x 42px:
      42px tall from 0.5rem padding + subhead-3's 1.5rem line box + 1px borders,
      and glyph-driven in width. Padding here would size to the icon instead
      (54 x 38px), so the box is set square to that measured height. */}
      <Flex
        boxSize="2.625rem"
        flexShrink={0}
        borderWidth="1px"
        borderColor="secondary.300"
        borderRadius="4px"
        alignItems="center"
        justifyContent="center"
      >
        <Icon as={BiEnvelope} aria-hidden fontSize="1.25rem" />
      </Flex>
      <Flex direction="row">
        <Text>
          {t('features.adminForm.sidebar.workflow.completionEmail.title')}
        </Text>
      </Flex>
    </Stack>
  )
}
