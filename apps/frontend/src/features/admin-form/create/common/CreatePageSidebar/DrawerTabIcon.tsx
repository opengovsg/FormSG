import { AdminFormSideNavItem } from '../../../common/AdminFormSideNav/AdminFormSideNav'

interface DrawerTabIconProps {
  icon: React.ReactElement
  onClick: () => void
  label: string
  /** Short label beneath the icon. */
  navLabel: string
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
}: DrawerTabIconProps): JSX.Element => (
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
