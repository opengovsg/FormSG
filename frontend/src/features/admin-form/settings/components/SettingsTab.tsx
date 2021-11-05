import { As, Box, Icon, Tab } from '@chakra-ui/react'

export interface SettingsTabProps {
  label: string
  icon: As
}

export const SettingsTab = ({ label, icon }: SettingsTabProps): JSX.Element => {
  return (
    <Tab justifyContent="flex-start" p="1rem">
      <Icon as={icon} color="currentcolor" fontSize="1.5rem" />
      <Box ml="1.5rem" display={{ base: 'none', lg: 'initial' }}>
        {label}
      </Box>
    </Tab>
  )
}
