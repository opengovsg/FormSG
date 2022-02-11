import { FC, forwardRef, useCallback, useEffect, useRef } from 'react'
import { Box, chakra, Flex, Icon, useMergeRefs } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import { useMultiSelectContext } from '~components/Dropdown/MultiSelectContext'

import { useSelectContext } from '../../SelectContext'

import { SelectedItems } from './SelectedItems'

const MultiItemsContainer: FC = ({ children }) => {
  return (
    <Box
      display="inline-flex"
      flexWrap="wrap"
      flexGrow={1}
      // Margin difference for selected items.
      my="-4px"
      // Padding for dropdown toggle.
      maxW="calc(100% - 2.5rem)"
    >
      {children}
    </Box>
  )
}

export const MultiSelectCombobox = forwardRef<HTMLInputElement>(
  (_props, ref): JSX.Element => {
    const {
      getComboboxProps,
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
      isFocused,
    } = useSelectContext()

    const { getDropdownProps } = useMultiSelectContext()

    const inputRef = useRef<HTMLInputElement | null>(null)
    const mergedRefs = useMergeRefs(inputRef, ref)

    const handleWrapperClick = useCallback(() => {
      if (isDisabled || isReadOnly) return
      setIsFocused(true)
      toggleMenu()
      if (!isOpen) {
        inputRef.current?.focus()
      }
    }, [isDisabled, isOpen, isReadOnly, setIsFocused, toggleMenu])

    // Focus input when focus state changes from false to true.
    useEffect(() => {
      if (isFocused) {
        inputRef.current?.focus()
      }
    }, [isFocused])

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
        {...getComboboxProps({
          disabled: isDisabled,
          readOnly: isReadOnly,
          required: isRequired,
          'aria-expanded': !!isOpen,
          onClick: handleWrapperClick,
        })}
      >
        <MultiItemsContainer>
          <SelectedItems />
          <chakra.input
            placeholder={placeholder}
            __css={styles.field}
            {...getInputProps(
              getDropdownProps({
                ref: mergedRefs,
                onFocus: () => setIsFocused(true),
                onKeyDown: handleInputTabKeydown,
                readOnly: isReadOnly,
                disabled: isDisabled,
              }),
            )}
          />
        </MultiItemsContainer>
        <Box
          display="inline-flex"
          py="0.3125rem"
          px="0.625rem"
          h="fit-content"
          aria-disabled={isDisabled}
          __css={styles.icon}
        >
          <Icon
            as={isOpen ? BxsChevronUp : BxsChevronDown}
            aria-disabled={isDisabled}
          />
        </Box>
      </Flex>
    )
  },
)
