import { Box, List, ListItem, useMultiStyleConfig } from '@chakra-ui/react'

import { useSelectContext } from '../SelectContext'
import { itemToValue } from '../utils/itemUtils'

import { DropdownItem } from './DropdownItem'

export const SelectMenu = (): JSX.Element => {
  const { getMenuProps, isOpen, items, nothingFoundLabel } = useSelectContext()

  const styles = useMultiStyleConfig('Combobox', {})

  return (
    <Box w="100%" zIndex="dropdown">
      <List {...getMenuProps()} sx={styles.list}>
        {isOpen &&
          items.map((item, index) => (
            <DropdownItem
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
