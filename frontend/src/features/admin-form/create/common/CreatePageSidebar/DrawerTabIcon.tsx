import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

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
    <Tooltip label={label} placement="right">
      <IconButton
        variant="reverse"
        aria-label={label}
        isActive={isActive}
        icon={icon}
        onClick={onClick}
        id={id}
      />
    </Tooltip>
  )
}
