import { As, Box, Icon, Tab } from '@chakra-ui/react'

import Badge from '~components/Badge'

export interface ResultsTabProps {
  label: string
  icon: As
  showBadge?: boolean
  badgeText?: string
}

export const ResultsTab = ({
  label,
  icon,
  showBadge = false,
  badgeText,
}: ResultsTabProps): JSX.Element => {
  return (
    <Tab justifyContent="flex-start" p="1rem">
      <Icon as={icon} color="currentcolor" fontSize="1.5rem" />
      <Box ml="1.5rem" display={{ base: 'none', lg: 'initial' }}>
        {label}
      </Box>
      {showBadge ? (
        <Badge
          ml="0.5rem"
          colorScheme="primary"
          variant="subtle"
          color="secondary.500"
          display={{ base: 'none', lg: 'initial' }}
        >
          {badgeText}
        </Badge>
      ) : null}
    </Tab>
  )
}
