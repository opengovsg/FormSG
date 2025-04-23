import { forwardRef, useCallback, useMemo } from 'react'
import {
  Flex,
  Icon,
  InputGroup,
  Stack,
  Text,
  useMergeRefs,
} from '@chakra-ui/react'

import Input from '~components/Input'

import { useSelectContext } from '../../SelectContext'
import { itemToIcon, itemToLabelString } from '../../utils/itemUtils'

import { ComboboxClearButton } from './ComboboxClearButton'
import { ToggleChevron } from './ToggleChevron'

// RATIONALE: This is used to prevent the scrollbar from blocking the text value, allowing for better readability.
const hideScrollbarStyles = {
  whiteSpace: 'nowrap',
  overflowX: 'auto',
  scrollBehavior: 'smooth',
  pointerEvents: 'auto',
  flex: '1',
  minWidth: '0',
  sx: {
    // hide scrollbar for Chrome, Safari and Opera
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    // hide scrollbar for Firefox
    scrollbarWidth: 'none',
    // hide scrollbar for IE and Edge
    msOverflowStyle: 'none',
  },
} as const

export const SelectCombobox = forwardRef<HTMLInputElement>(
  (_props, ref): JSX.Element => {
    const {
      toggleMenu,
      selectedItem,
      getInputProps,
      styles,
      isDisabled,
      isSearchable,
      isReadOnly,
      isInvalid,
      inputValue,
      isRequired,
      placeholder,
      isOpen,
      resetInputValue,
      inputRef,
      onBlur,
    } = useSelectContext()

    const mergedInputRef = useMergeRefs(inputRef, ref)

    const selectedItemMeta = useMemo(
      () => ({
        icon: itemToIcon(selectedItem),
        label: itemToLabelString(selectedItem),
      }),
      [selectedItem],
    )

    const handleToggleMenu = useCallback(() => {
      if (isReadOnly || isDisabled) return
      return toggleMenu()
    }, [isDisabled, isReadOnly, toggleMenu])

    return (
      <Flex onBlur={onBlur}>
        <InputGroup
          pos="relative"
          display="grid"
          gridTemplateColumns="1fr"
          _focusWithin={{
            zIndex: 1,
          }}
        >
          <Stack
            visibility={inputValue ? 'hidden' : 'initial'}
            direction="row"
            spacing="1rem"
            gridArea="1 / 1 / 2 / 3"
            {...(!isDisabled && {
              pointerEvents: 'none',
            })}
            pl="calc(1rem + 1px)"
            pr="calc(2.75rem + 1px)"
            align="center"
            zIndex={2}
            aria-hidden
            sx={styles.inputStack}
          >
            {selectedItemMeta.icon ? (
              <Icon
                ml="-0.25rem"
                sx={styles.icon}
                as={selectedItemMeta.icon}
                aria-disabled={isDisabled}
              />
            ) : null}
            <Text
              textStyle="body-1"
              noOfLines={1}
              {...(isDisabled
                ? {
                    ...hideScrollbarStyles,
                    color: 'neutral.800',
                  }
                : {})}
            >
              {selectedItemMeta.label}
            </Text>
          </Stack>
          <Input
            isReadOnly={!isSearchable || isReadOnly}
            isInvalid={isInvalid}
            isDisabled={isDisabled}
            placeholder={selectedItem ? undefined : placeholder}
            hasInputRightElement
            sx={styles.field}
            {...getInputProps({
              onClick: handleToggleMenu,
              onBlur: () => !isOpen && resetInputValue(),
              ref: mergedInputRef,
              disabled: isDisabled,
              readOnly: isReadOnly,
              required: isRequired,
              'aria-expanded': !!isOpen,
            })}
          />
          <ToggleChevron />
        </InputGroup>
        <ComboboxClearButton />
      </Flex>
    )
  },
)
