import { useEffect, useMemo } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { Box, List, ListItem } from '@chakra-ui/react'

import { useMultiSelectContext } from '../MultiSelectContext'
import { useSelectContext } from '../SelectContext'
import { itemToValue } from '../utils/itemUtils'

import { MultiDropdownItem } from './MultiDropdownItem'
import { useSelectPopover } from './SelectPopover'

export const MultiSelectMenu = (): JSX.Element => {
  const {
    getMenuProps,
    isOpen,
    items,
    nothingFoundLabel,
    styles,
    virtualListRef,
  } = useSelectContext()

  const { selectedItems } = useMultiSelectContext()

  const { popperRef, popperStyles, popperAttributes, update } =
    useSelectPopover()

  /**
   * Recalculate popper position when the menu opens or when selected items change.
   **/
  useEffect(() => {
    if (isOpen) {
      update?.()
    }
  }, [isOpen, selectedItems, update])

  const virtualHeight = useMemo(() => {
    const maxHeight = 12 * 16
    const totalHeight = items.length * 48
    // If the total height is less than the max height, just return the total height.
    // Otherwise, return the max height.
    return Math.min(totalHeight, maxHeight)
  }, [items.length])

  return (
    <Box
      ref={popperRef}
      style={popperStyles.popper}
      {...popperAttributes.popper}
      w="100%"
      zIndex="dropdown"
    >
      <List
        {...getMenuProps({
          hidden: !isOpen,
        })}
        sx={styles.list}
      >
        {isOpen && items.length > 0 && (
          <Virtuoso
            ref={virtualListRef}
            data={items}
            style={{ height: virtualHeight }}
            itemContent={(index, item) => {
              return (
                <MultiDropdownItem
                  key={`${itemToValue(item)}${index}`}
                  item={item}
                  index={index}
                />
              )
            }}
          />
        )}
        {isOpen && items.length === 0 ? (
          <ListItem role="option" sx={styles.emptyItem}>
            {nothingFoundLabel}
          </ListItem>
        ) : null}
      </List>
    </Box>
  )
}
