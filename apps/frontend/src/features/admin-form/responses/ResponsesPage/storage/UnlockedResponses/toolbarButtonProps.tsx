import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import Button from '~components/Button'
import IconButton from '~components/IconButton'

export const toolbarMenuButtonProps = ({
  icon,
  label,
  isOpen,
  isIconOnly,
}: {
  icon: JSX.Element
  label: string
  isOpen: boolean
  isIconOnly?: boolean
}) =>
  isIconOnly
    ? { as: IconButton, icon, 'aria-label': label, children: undefined }
    : {
        as: Button,
        leftIcon: icon,
        rightIcon: isOpen ? <BxsChevronUp /> : <BxsChevronDown />,
        children: label,
      }
