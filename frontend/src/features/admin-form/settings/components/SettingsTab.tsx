import { As, Icon, Tab } from '@chakra-ui/react'

export interface SettingsTabProps {
  label: string
  icon: As
}

export const SettingsTab = ({ label, icon }: SettingsTabProps): JSX.Element => {
  return (
    <Tab justifyContent="flex-start" p="1rem">
      <Icon as={icon} color="currentcolor" fontSize="1.5rem" mr="1.5rem" />
      {label}
    </Tab>
  )
}
