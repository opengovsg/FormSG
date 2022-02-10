import { HTMLProps } from 'react'
import {
  forwardRef,
  Icon,
  InputRightElement,
  SystemStyleObject,
} from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'

export interface ToggleChevronProps
  extends Omit<HTMLProps<HTMLDivElement>, 'as'> {
  isOpen: boolean
  sx: SystemStyleObject
  isDisabled: boolean
}

export const ToggleChevron = forwardRef<ToggleChevronProps, 'div'>(
  ({ isOpen, sx, isDisabled, ...props }, ref): JSX.Element => {
    // Cannot use useStyles as this component is nested in an InputGroup,
    // and the styles from InputGroup will be used instead.
    return (
      <InputRightElement {...props} ref={ref}>
        <Icon
          sx={sx}
          as={isOpen ? BxsChevronUp : BxsChevronDown}
          aria-disabled={isDisabled}
        />
      </InputRightElement>
    )
  },
)

// So input group knows to add right padding to the inner input.
ToggleChevron.id = InputRightElement.id
