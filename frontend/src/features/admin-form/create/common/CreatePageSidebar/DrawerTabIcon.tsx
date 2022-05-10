import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

interface DrawerTabIconProps {
  icon: React.ReactElement
  onClick: () => void
  label: string
  isActive: boolean
}

export const DrawerTabIcon = ({
  icon,
  onClick,
  label,
  isActive,
}: DrawerTabIconProps): JSX.Element => {
  return (
    <Tooltip label={label} placement="right">
      <IconButton
        variant="reverse"
        aria-label={label}
        isActive={isActive}
        icon={icon}
        onClick={onClick}
      />
    </Tooltip>
  )
}
