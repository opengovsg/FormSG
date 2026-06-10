import { GoDotFill } from 'react-icons/go'
import { Box, Flex, Icon, Text } from '@chakra-ui/react'

import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

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
      <Flex direction="column" align="center" gap="0.25rem">
        <Box position="relative" data-testid="drawer-tab-icon-box">
          {button}
          {showRedDot ? (
            <Icon
              as={GoDotFill}
              data-testid="drawer-tab-reddot"
              color="danger.500"
              position="absolute"
              top="-2px"
              right="-2px"
            />
          ) : null}
        </Box>
        <Text
          // Single size across states avoids reflow on selection; only weight/colour change.
          textStyle="caption-2"
          fontWeight={isActive ? 500 : 400}
          color={isActive ? 'primary.500' : 'secondary.400'}
          whiteSpace="nowrap"
        >
          {navLabel}
        </Text>
      </Flex>
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
