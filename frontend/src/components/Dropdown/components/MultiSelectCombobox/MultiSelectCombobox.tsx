import { FC, forwardRef, useCallback, useMemo, useRef } from 'react'
import { Box, chakra, Flex, Icon, useMergeRefs } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import { useMultiSelectContext } from '~components/Dropdown/MultiSelectContext'
import { itemToValue } from '~components/Dropdown/utils/itemUtils'

import { useSelectContext } from '../../SelectContext'
import { MultiSelectItem } from '../MultiSelectItem'

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
      isFocused,
      isOpen,
      toggleMenu,
      isInvalid,
    } = useSelectContext()

    const { getDropdownProps, selectedItems } = useMultiSelectContext()

    const inputRef = useRef<HTMLInputElement | null>(null)
    const mergedRefs = useMergeRefs(inputRef, ref)

    const items = useMemo(() => {
      return selectedItems.map((item, index) => (
        <MultiSelectItem
          item={item}
          index={index}
          key={`${itemToValue(item)}${index}`}
        />
      ))
    }, [selectedItems])

    const handleWrapperClick = useCallback(() => {
      setIsFocused(true)
      toggleMenu()
      if (!isOpen) {
        inputRef.current?.focus()
      }
    }, [isOpen, setIsFocused, toggleMenu])

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
          {items}
          <chakra.input
            placeholder={placeholder}
            cursor={isFocused ? undefined : 'pointer'}
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
