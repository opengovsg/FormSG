import { Icon, InputRightElement, useMultiStyleConfig } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'

import { useSelectContext } from '../SelectContext'

export const ToggleChevron = (): JSX.Element => {
  const { isOpen, getToggleButtonProps, isDisabled, styles } =
    useSelectContext()

  return (
    <InputRightElement {...getToggleButtonProps({ disabled: isDisabled })}>
      <Icon
        sx={styles.icon}
        as={isOpen ? BxsChevronUp : BxsChevronDown}
        aria-disabled={isDisabled}
      />
    </InputRightElement>
  )
}

// So input group knows to add right padding to the inner input.
ToggleChevron.id = InputRightElement.id
