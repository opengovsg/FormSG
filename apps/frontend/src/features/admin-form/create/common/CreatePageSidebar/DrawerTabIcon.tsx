import { GoDotFill } from 'react-icons/go'
import { Box, Icon } from '@chakra-ui/react'

import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { AdminFormSideNavItem } from '../../../common/AdminFormSideNav/AdminFormSideNav'

interface DrawerTabIconProps {
  icon: React.ReactElement
  onClick: () => void
  label: string
  /** Short label beneath the icon (treatment). When omitted, the tab is icon-only with a tooltip (control = production). */
  navLabel?: string
  isActive: boolean
  id?: string
  showRedDot?: boolean
  trackingLabel?: string
}

export const DrawerTabIcon = ({
  icon,
  onClick,
  label,
  navLabel,
  isActive,
  id,
  showRedDot,
  trackingLabel,
}: DrawerTabIconProps): JSX.Element => {
  const button = (
    <IconButton
      variant="reverse"
      aria-label={label}
      data-dd-action-name={trackingLabel}
      isActive={isActive}
      icon={icon}
      onClick={onClick}
      id={id}
    />
  )

  // Treatment arm: visible label beneath the icon, no tooltip.
  if (navLabel) {
    return (
      <AdminFormSideNavItem
        icon={icon}
        label={navLabel}
        aria-label={label}
        aria-pressed={isActive}
        data-dd-action-name={trackingLabel}
        isActive={isActive}
        onClick={onClick}
        id={id}
        showRedDot={showRedDot}
      />
    )
  }

  // Control arm: icon-only with a hover tooltip — identical to production.
  return (
    <Tooltip label={label} placement="right">
      <Box>
        {button}
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
