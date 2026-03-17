import { GoDotFill } from 'react-icons/go'
import { Box, Icon } from '@chakra-ui/react'

import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

interface DrawerTabIconProps {
  icon: React.ReactElement
  onClick: () => void
  label: string
  isActive: boolean
  id?: string
  showRedDot?: boolean
  trackingLabel?: string
}

export const DrawerTabIcon = ({
  icon,
  onClick,
  label,
  isActive,
  id,
  showRedDot,
  trackingLabel,
}: DrawerTabIconProps): JSX.Element => {
  return (
    <Tooltip label={label} placement="right">
      <Box>
        <IconButton
          variant="reverse"
          aria-label={label}
          data-dd-action-name={trackingLabel}
          isActive={isActive}
          icon={icon}
          onClick={onClick}
          id={id}
        />
        {showRedDot ? (
          <Icon
            as={GoDotFill}
            color="danger.500"
            position="absolute"
            ml="-15px"
          />
        ) : null}
      </Box>
    </Tooltip>
  )
}
