import { MouseEvent, useCallback, useMemo } from 'react'
import { Flex, Icon, Stack, TagLabel } from '@chakra-ui/react'

import { useMultiSelectContext } from '~components/Dropdown/MultiSelectContext'
import { useSelectContext } from '~components/Dropdown/SelectContext'
import { ComboboxItem } from '~components/Dropdown/types'
import {
  itemToIcon,
  itemToLabelString,
} from '~components/Dropdown/utils/itemUtils'
import { Tag, TagCloseButton, TagProps } from '~components/Tag'

export interface MultiSelectItemProps<Item extends ComboboxItem = ComboboxItem>
  extends TagProps {
  item: Item
  index: number
}

export const MultiSelectItem = ({
  item,
  index,
  ...props
}: MultiSelectItemProps): JSX.Element => {
  const {
    isDisabled,
    isReadOnly,
    setIsFocused,
    inputRef,
    closeMenu,
    isOpen,
    styles,
  } = useSelectContext()
  const { getSelectedItemProps, removeSelectedItem } = useMultiSelectContext()

  const itemMeta = useMemo(() => {
    return {
      label: itemToLabelString(item),
      icon: itemToIcon(item),
    }
  }, [item])

  const handleRemoveItem = useCallback(
    (e: MouseEvent) => {
      // Required so tag can properly gain focus without the parent from
      // stealing focus due to parent's onClick handler.
      e.stopPropagation()
      if (isDisabled || isReadOnly) return
      inputRef?.current?.focus()
      setIsFocused(true)

      removeSelectedItem(item)
    },
    [isDisabled, isReadOnly, item, removeSelectedItem, setIsFocused, inputRef],
  )

  const handleTagClick = useCallback(
    (e: MouseEvent) => {
      // Required so tag can properly gain focus without the parent from
      // stealing focus due to parent's onClick handler.
      e.stopPropagation()
      if (isDisabled || isReadOnly) return
      inputRef?.current?.focus()
      setIsFocused(true)

      if (isOpen) {
        closeMenu()
      }
    },
    [closeMenu, isDisabled, isOpen, isReadOnly, setIsFocused, inputRef],
  )

  return (
    <Tag
      title={itemMeta.label}
      colorScheme="secondary"
      m="2px"
      h="2rem"
      {...getSelectedItemProps({
        selectedItem: item,
        index,
        disabled: isDisabled,
        onMouseDown: (event) => {
          // What: Prevent default focus on tab when clicking remove tag, to avoid invoking MultiSelect's onBlur
          // callback function.
          // Why: This allows onBlur of MultiSelect to be invoked only when user clicks out of the MultiSelect component.
          event.preventDefault()
        },
        onKeyDown: (event) => {
          if (
            (isDisabled || isReadOnly) &&
            (event.key === 'Backspace' || event.key === 'Delete')
          ) {
            // Prevent Downshift's default behavior where backspace or delete will
            // remove the item from selection regardless of whether the input is disabled.
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            event.nativeEvent.preventDownshiftDefault = true
          }
        },
        onClick: handleTagClick,
      })}
      {...props}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        w="100%"
      >
        <Flex alignItems="center" overflow="hidden">
          {itemMeta.icon ? (
            <Icon
              aria-hidden
              sx={styles.icon}
              mr="0.25rem"
              as={itemMeta.icon}
              aria-disabled={isDisabled}
            />
          ) : null}
          <TagLabel>{itemMeta.label}</TagLabel>
        </Flex>
        <TagCloseButton
          tabIndex={-1}
          aria-hidden
          isDisabled={isDisabled}
          onClick={handleRemoveItem}
        />
      </Stack>
    </Tag>
  )
}
