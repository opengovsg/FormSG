import { Box, Divider, Text } from '@chakra-ui/react'

import { FormLimitToggle } from './components/FormLimitToggle'
import { FormStatusToggle } from './components/FormStatusToggle'

export const SettingsGeneralPage = (): JSX.Element => {
  return (
    <Box maxW="42.5rem">
      <Text as="h2" textStyle="h2" color="secondary.500" mb="2.5rem">
        Respondent access
      </Text>
      <FormStatusToggle />
      <Divider my="2.5rem" />
      <Text
        as="h3"
        textTransform="uppercase"
        textStyle="subhead-3"
        color="primary.500"
        mb="2rem"
      >
        Scheduling
      </Text>
      <FormLimitToggle />
    </Box>
  )
}
