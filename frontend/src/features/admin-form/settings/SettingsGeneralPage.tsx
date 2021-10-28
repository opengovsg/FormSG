import { Box, Text } from '@chakra-ui/react'

import { FormStatusToggle } from './components/FormStatusToggle'

export const SettingsGeneralPage = (): JSX.Element => {
  return (
    <Box maxW="42.5rem">
      <Text as="h2" textStyle="h2" color="secondary.500" mb="2.5rem">
        Respondent access
      </Text>
      <FormStatusToggle />
    </Box>
  )
}
