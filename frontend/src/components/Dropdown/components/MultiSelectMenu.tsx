import { useEffect } from 'react'
import { Box, List, ListItem } from '@chakra-ui/react'

import { useMultiSelectContext } from '../MultiSelectContext'
import { useSelectContext } from '../SelectContext'
import { itemToValue } from '../utils/itemUtils'

import { MultiDropdownItem } from './MultiDropdownItem'
import { useSelectPopover } from './SelectPopover'

export const MultiSelectMenu = (): JSX.Element => {
  const { getMenuProps, isOpen, items, nothingFoundLabel, styles } =
    useSelectContext()

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
        {isOpen &&
          items.map((item, index) => (
            <MultiDropdownItem
              key={`${itemToValue(item)}${index}`}
              item={item}
              index={index}
            />
          ))}
        {isOpen && items.length === 0 ? (
          <ListItem role="option" sx={styles.emptyItem}>
            {nothingFoundLabel}
          </ListItem>
        ) : null}
      </List>
    </Box>
  )
}
