import { FC } from 'react'
import { Box, Divider, Text } from '@chakra-ui/react'

import { FormCustomisationSection } from './components/FormCustomisationSection'
import { FormLimitToggle } from './components/FormLimitToggle'
import { FormStatusToggle } from './components/FormStatusToggle'

const SubcategoryHeader: FC = ({ children }) => {
  return (
    <Text
      as="h3"
      textTransform="uppercase"
      textStyle="subhead-3"
      color="primary.500"
      mb="2rem"
    >
      {children}
    </Text>
  )
}

export const SettingsGeneralPage = (): JSX.Element => {
  return (
    <Box maxW="42.5rem">
      <Text as="h2" textStyle="h2" color="secondary.500" mb="2.5rem">
        Respondent access
      </Text>
      <FormStatusToggle />
      <Divider my="2.5rem" />
      <SubcategoryHeader>Scheduling</SubcategoryHeader>
      <FormLimitToggle />
      <Divider my="2.5rem" />
      <SubcategoryHeader>Customisation</SubcategoryHeader>
      <FormCustomisationSection />
    </Box>
  )
}
