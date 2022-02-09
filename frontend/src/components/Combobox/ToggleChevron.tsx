import { Icon, IconProps, InputRightElement, useStyles } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'

export interface ToggleChevronProps extends Omit<IconProps, 'css'> {
  isOpen: boolean
}

export const ToggleChevron = ({
  isOpen,
  ...props
}: ToggleChevronProps): JSX.Element => {
  const styles = useStyles()

  return (
    <InputRightElement>
      <Icon
        as={isOpen ? BxsChevronUp : BxsChevronDown}
        __css={styles.icon}
        {...props}
      />
    </InputRightElement>
  )
}
