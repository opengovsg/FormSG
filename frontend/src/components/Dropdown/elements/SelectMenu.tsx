import { useCallback } from 'react'
import { Box, List, useMultiStyleConfig } from '@chakra-ui/react'

import { ItemWithIndex } from '../hooks/useItems'
import { useSelectContext } from '../SelectContext'
import { itemToValue } from '../utils/itemUtils'

import { DropdownItem } from './DropdownItem'

export const SelectMenu = (): JSX.Element => {
  const { getMenuProps, isOpen, mapDropdownItems } = useSelectContext()

  const styles = useMultiStyleConfig('Combobox', {})

  const dropdownRenderer = useCallback(
    ({ item, index }: ItemWithIndex) => (
      <DropdownItem
        key={`${itemToValue(item)}${index}`}
        item={item}
        index={index}
      />
    ),
    [],
  )

  return (
    <Box w="100%" zIndex="dropdown">
      <List {...getMenuProps()} sx={styles.list}>
        {isOpen && mapDropdownItems(dropdownRenderer)}
        {/* {isOpen && filteredItems.length === 0 ? (
          <ListItem role="option" sx={styles.emptyItem}>
            {nothingFoundLabel}
          </ListItem>
        ) : null} */}
      </List>
    </Box>
  )
}
