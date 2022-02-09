import { HTMLProps } from 'react'
import { Icon, InputRightElement, SystemStyleObject } from '@chakra-ui/react'
import {} from 'downshift'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'

export interface ToggleChevronProps
  extends Omit<HTMLProps<HTMLDivElement>, 'as'> {
  isOpen: boolean
  sx: SystemStyleObject
  isDisabled: boolean
}

export const ToggleChevron = ({
  isOpen,
  sx,
  isDisabled,
  ...props
}: ToggleChevronProps): JSX.Element => {
  // Cannot use useStyles as this component is nested in an InputGroup,
  // and the styles from InputGroup will be used instead.
  return (
    <InputRightElement {...props}>
      <Icon
        sx={sx}
        as={isOpen ? BxsChevronUp : BxsChevronDown}
        aria-disabled={isDisabled}
      />
    </InputRightElement>
  )
}

// So input group knows to add right padding to the inner input.
ToggleChevron.id = InputRightElement.id
