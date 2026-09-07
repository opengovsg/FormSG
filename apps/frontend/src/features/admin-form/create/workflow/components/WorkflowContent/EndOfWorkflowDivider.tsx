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
      {/* subhead-3 to match the step card headers this sits between; it also
      carries letterSpacing 0.08em, so no hand-written prop.

      Colour stays recessed toward the rules rather than matching them: the
      rules' own secondary.200 measures 1.33:1 on this background, against the
      4.5:1 AA needs for 14px/600 text. secondary.400 is 4.60:1. */}
      <Text textStyle="subhead-3" color="secondary.400" whiteSpace="nowrap">
        {t('features.adminForm.sidebar.workflow.completionEmail.divider')}
      </Text>
      <Divider borderColor="secondary.200" borderBottomWidth="2px" />
    </Flex>
  )
}
