import { GoDotFill } from 'react-icons/go'
import { Flex, Icon, Text } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

interface DrawerTabIconProps {
  icon: React.ReactElement
  onClick: () => void
  label: string
  /** Short label displayed below the icon (e.g. "Build", "Header") */
  shortLabel?: string
  isActive: boolean
  id?: string
  showRedDot?: boolean
  trackingLabel?: string
}

export const DrawerTabIcon = ({
  icon,
  onClick,
  label,
  shortLabel,
  isActive,
  id,
  showRedDot,
  trackingLabel,
}: DrawerTabIconProps): JSX.Element => {
  return (
    <Flex direction="column" align="center" gap="0.25rem" position="relative">
      <IconButton
        variant="reverse"
        aria-label={label}
        data-dd-action-name={trackingLabel}
        isActive={isActive}
        icon={icon}
        onClick={onClick}
        id={id}
        fontSize="1.5rem"
        color={isActive ? undefined : 'secondary.400'}
      />
      {shortLabel && (
        <Text
          textStyle={isActive ? 'caption-1' : 'caption-2'}
          textAlign="center"
          color={isActive ? 'primary.500' : 'secondary.400'}
        >
          {shortLabel}
        </Text>
      )}
      {showRedDot ? (
        <Icon
          as={GoDotFill}
          color="danger.500"
          position="absolute"
          top="-2px"
          right="-2px"
        />
      ) : null}
    </Flex>
  )
}
