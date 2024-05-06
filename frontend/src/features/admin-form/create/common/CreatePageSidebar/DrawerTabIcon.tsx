import { IconButton, TouchableTooltip } from '@opengovsg/design-system-react'

interface DrawerTabIconProps {
  icon: React.ReactElement
  onClick: () => void
  label: string
  isActive: boolean
  id?: string
}

export const DrawerTabIcon = ({
  icon,
  onClick,
  label,
  isActive,
  id,
}: DrawerTabIconProps): JSX.Element => {
  return (
    <TouchableTooltip label={label} placement="right">
      <IconButton
        variant="reverse"
        aria-label={label}
        isActive={isActive}
        icon={icon}
        onClick={onClick}
        id={id}
      />
    </TouchableTooltip>
  )
}
