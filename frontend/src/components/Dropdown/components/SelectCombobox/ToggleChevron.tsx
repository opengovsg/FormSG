import { Icon, InputRightElement } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'

import { useSelectContext } from '../../SelectContext'

export const ToggleChevron = (): JSX.Element => {
  const { isOpen, getToggleButtonProps, isDisabled, isReadOnly, styles } =
    useSelectContext()

  return (
    <InputRightElement
      as="button"
      type="button"
      h="100%"
      display="flex"
      alignItems="center"
      _disabled={{
        cursor: 'not-allowed',
      }}
      aria-label={`${isOpen ? 'Close' : 'Open'} dropdown options`}
      {...getToggleButtonProps({
        disabled: isDisabled || isReadOnly,
        // Allow navigation to this button with screen readers.
        tabIndex: 0,
      })}
    >
      <Icon
        sx={styles.icon}
        as={isOpen ? BxsChevronUp : BxsChevronDown}
        aria-disabled={isDisabled || isReadOnly}
      />
    </InputRightElement>
  )
}

// So input group knows to add right padding to the inner input.
ToggleChevron.id = InputRightElement.id
