import { useMemo } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { Box, List, ListItem } from '@chakra-ui/react'

import { useSelectContext } from '../SelectContext'
import { itemToValue } from '../utils/itemUtils'

import { DropdownItem } from './DropdownItem'
import { useSelectPopover } from './SelectPopover'

export const SelectMenu = (): JSX.Element => {
  const {
    getMenuProps,
    isOpen,
    items,
    nothingFoundLabel,
    styles,
    virtualListRef,
  } = useSelectContext()

  const { popperRef, popperStyles, popperAttributes } = useSelectPopover()

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
                <DropdownItem
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
