import { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiChevronRight, BiEnvelope } from 'react-icons/bi'
import { As, Flex, Icon, List, ListItem, Text } from '@chakra-ui/react'
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react'

import { MultiDropdownItem } from '~components/Dropdown/components/MultiDropdownItem'
import { useSelectPopover } from '~components/Dropdown/components/SelectPopover'
import { useDropdownMenuZIndex } from '~components/Dropdown/DropdownMenuLayer'
import { useSelectContext } from '~components/Dropdown/SelectContext'
import { ComboboxItem } from '~components/Dropdown/types'
import { isItemAction, itemToValue } from '~components/Dropdown/utils/itemUtils'

import {
  EmailSourceFieldKind,
  NEW_EMAIL_VALUE_PREFIX,
  panelValue,
} from './emailSource'

export interface EmailSourcePanel {
  kind: EmailSourceFieldKind
  label: string
  icon: As
  emptyLabel: string
  items: ComboboxItem[]
}

interface EmailSourceMenuProps {
  panels: EmailSourcePanel[]
  openPanel: EmailSourceFieldKind | null
}

const SIDE_PANEL_WIDTH = '16rem'
const SIDE_PANEL_SPACE_PX = 16 * 16 + 4

const PanelRow = ({
  panel,
  index,
  isOpen,
}: {
  panel: EmailSourcePanel
  index: number
  isOpen: boolean
}): JSX.Element => {
  const { getItemProps, items, styles, isDisabled } = useSelectContext()
  const { refs, floatingStyles, update } = useFloating({
    placement: 'right-start',
    strategy: 'absolute',
    middleware: [
      offset(4),
      flip({ fallbackPlacements: ['left-start'] }),
      shift({ padding: 8 }),
    ],
  })

  const [isInline, setIsInline] = useState(false)

  useLayoutEffect(() => {
    const row = refs.domReference.current
    if (!isOpen || !row) return
    const { left, right } = row.getBoundingClientRect()
    setIsInline(
      left < SIDE_PANEL_SPACE_PX &&
        right + SIDE_PANEL_SPACE_PX > window.innerWidth,
    )
  }, [isOpen, refs.domReference])

  useLayoutEffect(() => {
    if (isOpen && refs.reference.current && refs.floating.current) {
      return autoUpdate(refs.reference.current, refs.floating.current, update)
    }
  }, [isOpen, refs.floating, refs.reference, update])

  return (
    <>
      <ListItem
        sx={{ ...styles.item, ...(isOpen ? { bg: 'primary.100' } : {}) }}
        {...getItemProps({
          item: items[index],
          index,
          disabled: isDisabled,
          ref: refs.setReference,
        })}
        aria-expanded={isOpen}
      >
        <Flex align="center" gap="0.5rem">
          <Icon as={panel.icon} sx={styles.icon} />
          <Text textStyle="body-1" flex={1}>
            {panel.label}
          </Text>
          <Icon as={BiChevronRight} fontSize="1.25rem" />
        </Flex>
      </ListItem>
      {isOpen ? (
        <ListItem role="none">
          <List
            ref={isInline ? undefined : refs.setFloating}
            style={isInline ? undefined : floatingStyles}
            role="group"
            aria-label={panel.label}
            sx={
              isInline
                ? { pl: '1.5rem' }
                : { ...styles.list, w: SIDE_PANEL_WIDTH, maxH: '16rem' }
            }
          >
            {panel.items.every(isItemAction) ? (
              <ListItem role="none" sx={styles.emptyItem}>
                {panel.emptyLabel}
              </ListItem>
            ) : null}
            {items.map((item, itemIndex) =>
              panel.items.includes(item) ? (
                <MultiDropdownItem
                  key={itemToValue(item)}
                  item={item}
                  index={itemIndex}
                />
              ) : null,
            )}
          </List>
        </ListItem>
      ) : null}
    </>
  )
}

export const EmailSourceMenu = ({
  panels,
  openPanel,
}: EmailSourceMenuProps): JSX.Element => {
  const { t } = useTranslation()
  const { getMenuProps, isOpen, items, styles } = useSelectContext()
  const { floatingRef, floatingStyles } = useSelectPopover()
  const menuZIndex = useDropdownMenuZIndex()

  const addEmailItem = items.find((item) =>
    itemToValue(item).startsWith(NEW_EMAIL_VALUE_PREFIX),
  )

  return (
    <FloatingPortal>
      <List
        style={floatingStyles}
        {...getMenuProps({ hidden: !isOpen, ref: floatingRef })}
        sx={{
          ...styles.list,
          // RATIONALE: the side panels sit inside the menu so downshift
          // counts clicks on them as inside, and must not be clipped.
          overflowY: 'visible',
          maxH: 'none',
          ...(menuZIndex ? { zIndex: menuZIndex } : {}),
        }}
      >
        {isOpen ? (
          <>
            {addEmailItem ? (
              <MultiDropdownItem
                item={addEmailItem}
                index={items.indexOf(addEmailItem)}
              />
            ) : (
              <ListItem role="none" sx={styles.item} cursor="default">
                <Flex align="center" gap="0.5rem" color="secondary.400">
                  <Icon as={BiEnvelope} sx={styles.icon} />
                  <Text textStyle="body-1">
                    {t('components.emailSourceInput.typedEmailHint')}
                  </Text>
                </Flex>
              </ListItem>
            )}
            {panels.map((panel) => (
              <PanelRow
                key={panel.kind}
                panel={panel}
                index={items.findIndex(
                  (item) => itemToValue(item) === panelValue(panel.kind),
                )}
                isOpen={openPanel === panel.kind}
              />
            ))}
          </>
        ) : null}
      </List>
    </FloatingPortal>
  )
}
