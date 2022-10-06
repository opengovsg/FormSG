import { Virtuoso } from 'react-virtuoso'
import { List, ListItem } from '@chakra-ui/react'
import { FloatingPortal } from '@floating-ui/react-dom-interactions'

import { VIRTUAL_LIST_OVERSCAN_HEIGHT } from '../constants'
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
    virtualListHeight,
  } = useSelectContext()

  const { floatingRef, floatingStyles } = useSelectPopover()

  return (
    <FloatingPortal>
      <List
        {...getMenuProps(
          { ref: floatingRef },
          // Suppressing ref error since this will be in a portal and will be conditionally rendered.
          // See https://github.com/downshift-js/downshift/issues/1272#issuecomment-1063244446
          { suppressRefError: true },
        )}
        style={floatingStyles}
        sx={styles.list}
      >
        {isOpen && items.length > 0 && (
          <Virtuoso
            ref={virtualListRef}
            data={items}
            overscan={VIRTUAL_LIST_OVERSCAN_HEIGHT}
            style={{ height: virtualListHeight }}
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
    </FloatingPortal>
  )
}
