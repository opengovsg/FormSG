import { Box, List, ListItem } from '@chakra-ui/react'

import { useSelectContext } from '../SelectContext'
import { itemToValue } from '../utils/itemUtils'

import { DropdownItem } from './DropdownItem'
import { useSelectPopover } from './SelectPopover'

export const SelectMenu = (): JSX.Element => {
  const { getMenuProps, isOpen, items, nothingFoundLabel, styles } =
    useSelectContext()

  const { popperRef, popperStyles, popperAttributes } = useSelectPopover()

  return (
    <Box
      ref={popperRef}
      style={popperStyles.popper}
      {...popperAttributes.popper}
      w="100%"
      zIndex="dropdown"
    >
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
