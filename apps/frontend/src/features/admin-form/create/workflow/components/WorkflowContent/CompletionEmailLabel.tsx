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
      <Flex
        py="0.5rem"
        px="1rem"
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
