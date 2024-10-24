import { Virtuoso } from 'react-virtuoso'
import { List, ListItem } from '@chakra-ui/react'
import { FloatingPortal } from '@floating-ui/react'

import { VIRTUAL_LIST_OVERSCAN_HEIGHT } from '../constants'
import { useSelectContext } from '../SelectContext'
import { itemToValue } from '../utils/itemUtils'

import { DropdownItem } from './DropdownItem'
import { useSelectPopover } from './SelectPopover'

const ListItems = () => {
  const { items } = useSelectContext()
  return (
    <>
      {items.map((item, idx) => {
        return (
          <DropdownItem
            key={`${itemToValue(item)}${idx}`}
            item={item}
            index={idx}
          />
        )
      })}
    </>
  )
}

const NothingFoundItem = () => {
  const { styles, nothingFoundLabel } = useSelectContext()
  return (
    <ListItem role="option" sx={styles.emptyItem}>
      {nothingFoundLabel}
    </ListItem>
  )
}

const RenderIfOpen = ({
  isOpen,
  children,
}: {
  isOpen: boolean
  children: JSX.Element
}) => {
  if (!isOpen) {
    return null
  }
  return children
}

export const SelectMenu = (): JSX.Element => {
  const {
    getMenuProps,
    isOpen,
    items,
    styles,
    virtualListRef,
    virtualListHeight,
    fullWidth,
    zIndex,
  } = useSelectContext()

  const { floatingRef, floatingStyles } = useSelectPopover()

  const listSx = {
    ...styles.list,
    ...(fullWidth ? { maxH: '100%' } : {}),
  }

  return (
    <FloatingPortal>
      <List
        {...getMenuProps(
          { ref: floatingRef },
          // Suppressing ref error since this will be in a portal and will be conditionally rendered.
          // See https://github.com/downshift-js/downshift/issues/1272#issuecomment-1063244446
          { suppressRefError: true },
        )}
        zIndex={zIndex}
        style={floatingStyles}
        sx={listSx}
      >
        <RenderIfOpen isOpen={isOpen}>
          {items.length > 0 ? (
            fullWidth ? (
              <ListItems />
            ) : (
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
            )
          ) : (
            <NothingFoundItem />
          )}
        </RenderIfOpen>
      </List>
    </FloatingPortal>
  )
}
