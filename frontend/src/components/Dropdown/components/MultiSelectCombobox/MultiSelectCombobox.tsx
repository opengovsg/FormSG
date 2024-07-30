import { forwardRef, useCallback } from 'react'
import { Box, chakra, Flex, Icon, useMergeRefs } from '@chakra-ui/react'

import { FCC } from '~typings/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import { useMultiSelectContext } from '~components/Dropdown/MultiSelectContext'

import { useSelectContext } from '../../SelectContext'

import { SelectedItems } from './SelectedItems'

const MultiItemsContainer: FCC = ({ children }) => {
  return (
    <Box
      display="inline-flex"
      flexWrap="wrap"
      flexGrow={1}
      // Margin difference for selected items.
      my="-3px"
      // Padding for dropdown toggle.
      flexBasis="calc(100% - 2.5rem)"
      minW="0px"
    >
      {children}
    </Box>
  )
}

export const MultiSelectCombobox = forwardRef<HTMLInputElement>(
  (_props, ref): JSX.Element => {
    const {
      getInputProps,
      styles,
      isDisabled,
      isReadOnly,
      isRequired,
      placeholder,
      setIsFocused,
      isOpen,
      toggleMenu,
      isInvalid,
      inputRef,
      getToggleButtonProps,
    } = useSelectContext()

    const { getDropdownProps } = useMultiSelectContext()

    const mergedRefs = useMergeRefs(inputRef, ref)

    const handleToggleMenu = useCallback(() => {
      if (isDisabled || isReadOnly) return
      if (!isOpen) {
        inputRef?.current?.focus()
      }
      toggleMenu()
      setIsFocused(true)
    }, [inputRef, isDisabled, isOpen, isReadOnly, setIsFocused, toggleMenu])

    /**
     * So faux input gets correctly blurred when navigated away.
     */
    const handleInputTabKeydown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Tab') {
          setIsFocused(false)
        }
      },
      [setIsFocused],
    )

    return (
      <Flex
        aria-disabled={isDisabled}
        aria-invalid={isInvalid}
        aria-readonly={isReadOnly}
        __css={styles.fieldwrapper}
        onClick={handleToggleMenu}
      >
        <MultiItemsContainer>
          <SelectedItems />
          <chakra.input
            placeholder={placeholder}
            __css={styles.field}
            {...getInputProps({
              ...getDropdownProps({
                ref: mergedRefs,
                onFocus: () => setIsFocused(true),
                onKeyDown: handleInputTabKeydown,
                readOnly: isReadOnly,
                disabled: isDisabled,
              }),
              required: isRequired,
              'aria-expanded': !!isOpen,
            })}
          />
        </MultiItemsContainer>
        <Box
          as="button"
          type="button"
          pt="0.25rem"
          px="0.5rem"
          _disabled={{
            cursor: 'not-allowed',
          }}
          alignSelf="flex-start"
          sx={styles.icon}
          aria-label={`${isOpen ? 'Close' : 'Open'} dropdown options`}
          {...getToggleButtonProps({
            disabled: isDisabled || isReadOnly,
            // Allow navigation to this button with screen readers.
            tabIndex: 0,
            // onClick needs to be defined on the toggle button itself to allow
            // screen readers to activate the click action, but need to stop
            // bubbling up to the parent to avoid double-toggling
            onClick: (e) => e.stopPropagation(),
          })}
        >
          <Icon
            as={isOpen ? BxsChevronUp : BxsChevronDown}
            aria-disabled={isDisabled || isReadOnly}
          />
        </Box>
      </Flex>
    )
  },
)
