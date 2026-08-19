import { useTranslation } from 'react-i18next'
import { Divider, Flex, Text } from '@chakra-ui/react'

/**
 * Labelled boundary between the last workflow step and the completion email
 * card. Without it the card reads as one more step rather than as what happens
 * after the workflow ends.
 */
export const EndOfWorkflowDivider = (): JSX.Element => {
  const { t } = useTranslation()
  return (
    <Flex align="center" gap="1rem">
      <Divider borderColor="secondary.200" borderBottomWidth="2px" />
      <Text
        textStyle="caption-1"
        color="secondary.400"
        whiteSpace="nowrap"
        letterSpacing="0.08em"
      >
        {t('features.adminForm.sidebar.workflow.completionEmail.divider')}
      </Text>
      <Divider borderColor="secondary.200" borderBottomWidth="2px" />
    </Flex>
  )
}
