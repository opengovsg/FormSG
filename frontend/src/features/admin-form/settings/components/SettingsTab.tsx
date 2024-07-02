import { GoPrimitiveDot } from 'react-icons/go'
import { As, Box, Icon, Tab } from '@chakra-ui/react'

export interface SettingsTabProps {
  label: string
  icon: As
  showRedDot?: boolean
}

export const SettingsTab = ({
  label,
  icon,
  showRedDot,
}: SettingsTabProps): JSX.Element => {
  return (
    <Tab justifyContent="flex-start" p="1rem">
      <Icon as={icon} color="currentcolor" fontSize="1.5rem" />
      {showRedDot ? (
        <Icon
          as={GoPrimitiveDot}
          color="danger.500"
          position="absolute"
          ml="20px"
          mt="-20px"
        />
      ) : null}
      <Box ml="1.5rem" display={{ base: 'none', lg: 'initial' }}>
        {label}
      </Box>
    </Tab>
  )
}
