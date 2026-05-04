import { useTranslation } from 'react-i18next'
import { As, Box, Icon, Tab } from '@chakra-ui/react'

import Badge from '~components/Badge'

export interface SettingsTabProps {
  label: string
  icon: As
  showNewBadge?: boolean
}

export const SettingsTab = ({
  label,
  icon,
  showNewBadge = false,
}: SettingsTabProps): JSX.Element => {
  const { t } = useTranslation()
  const { newBadge } = t('features.adminForm.settings.tabs', {
    returnObjects: true,
  })

  return (
    <Tab justifyContent="flex-start" p="1rem">
      <Icon as={icon} color="currentcolor" fontSize="1.5rem" />
      <Box ml="1.5rem" display={{ base: 'none', lg: 'initial' }}>
        {label}
      </Box>
      {showNewBadge ? (
        <Badge
          ml="0.5rem"
          colorScheme="success"
          display={{ base: 'none', lg: 'initial' }}
        >
          {newBadge}
        </Badge>
      ) : null}
    </Tab>
  )
}
