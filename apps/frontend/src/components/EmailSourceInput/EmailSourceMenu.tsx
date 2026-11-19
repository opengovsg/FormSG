import { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BiChevronDown, BiChevronRight, BiEnvelope } from 'react-icons/bi'
import {
  As,
  Box,
  Flex,
  Icon,
  List,
  ListItem,
  TagLabel,
  Text,
} from '@chakra-ui/react'
import {
  autoUpdate,
  FloatingPortal,
  offset,
  ReferenceElement,
  shift,
  size,
  useFloating,
} from '@floating-ui/react'
import isEmail from 'validator/lib/isEmail'

import { useIsMobile } from '~hooks/useIsMobile'
import { MultiDropdownItem } from '~components/Dropdown/components/MultiDropdownItem'
import { useSelectPopover } from '~components/Dropdown/components/SelectPopover'
import { useDropdownMenuZIndex } from '~components/Dropdown/DropdownMenuLayer'
import { useSelectContext } from '~components/Dropdown/SelectContext'
import { ComboboxItem } from '~components/Dropdown/types'
import { isItemAction, itemToValue } from '~components/Dropdown/utils/itemUtils'
import { splitEmails } from '~components/EmailListInput'
import { Tag } from '~components/Tag'

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

const PANEL_GAP_PX = 4

const rowAndMenuRects = (row: ReferenceElement) => {
  const menu = row instanceof Element ? row.parentElement : null
  return menu
    ? { row: row.getBoundingClientRect(), menu: menu.getBoundingClientRect() }
    : null
}

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
  const isMobile = useIsMobile()
  const { refs, floatingStyles, update } = useFloating({
    placement: 'right-start',
    strategy: 'absolute',
    middleware: [
      offset(({ elements }) => {
        const rects = rowAndMenuRects(elements.reference)
        return (rects ? rects.menu.right - rects.row.right : 0) + PANEL_GAP_PX
      }),
      size({
        apply({ elements }) {
          const rects = rowAndMenuRects(elements.reference)
          if (!rects) return
          elements.floating.style.width = `${rects.menu.width - PANEL_GAP_PX}px`
        },
      }),
      shift({ padding: 8 }),
    ],
  })

  const panelValues = new Set(panel.items.map(itemToValue))

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
          <Icon
            as={isMobile ? BiChevronDown : BiChevronRight}
            fontSize="1.25rem"
          />
        </Flex>
      </ListItem>
      {isOpen ? (
        <ListItem role="none">
          <List
            ref={isMobile ? undefined : refs.setFloating}
            style={isMobile ? undefined : floatingStyles}
            role="group"
            aria-label={panel.label}
            sx={
              isMobile
                ? { '& > li': { pl: '2.5rem' } }
                : { ...styles.list, maxH: '16rem' }
            }
          >
            {panel.items.every(isItemAction) ? (
              <ListItem role="none" sx={styles.emptyItem}>
                {panel.emptyLabel}
              </ListItem>
            ) : null}
            {items.map((item, itemIndex) =>
              panelValues.has(itemToValue(item)) ? (
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

const AddEmailRow = ({
  item,
  index,
}: {
  item: ComboboxItem
  index: number
}): JSX.Element => {
  const { t } = useTranslation()
  const { getItemProps, styles, isDisabled } = useSelectContext()
  const emails = splitEmails(
    itemToValue(item).slice(NEW_EMAIL_VALUE_PREFIX.length),
  )

  return (
    <ListItem
      sx={styles.item}
      {...getItemProps({ item, index, disabled: isDisabled })}
    >
      <Flex align="center" gap="0.5rem" wrap="wrap">
        <Icon as={BiEnvelope} sx={styles.icon} />
        <Text textStyle="body-1">
          {t('components.emailSourceInput.pressEnterToAdd')}
        </Text>
        {emails.map((email) => (
          <Tag
            key={email}
            colorScheme={isEmail(email) ? 'secondary' : 'danger'}
            maxW="100%"
          >
            <TagLabel>{email}</TagLabel>
          </Tag>
        ))}
      </Flex>
    </ListItem>
  )
}

export const EmailSourceMenu = ({
  panels,
  openPanel,
}: EmailSourceMenuProps): JSX.Element => {
  const { t } = useTranslation()
  const { getMenuProps, isOpen, items, styles } = useSelectContext()
  const isMobile = useIsMobile()
  const { floatingRef, floatingStyles } = useSelectPopover()
  const menuZIndex = useDropdownMenuZIndex()

  const addEmailItem = items.find((item) =>
    itemToValue(item).startsWith(NEW_EMAIL_VALUE_PREFIX),
  )

  return (
    <FloatingPortal>
      <Box
        ref={floatingRef}
        style={floatingStyles}
        pointerEvents="none"
        zIndex={menuZIndex}
      >
        <List
          {...getMenuProps({ hidden: !isOpen })}
          sx={{
            ...styles.list,
            w: isMobile ? '100%' : '50%',
            pointerEvents: 'auto',
            // RATIONALE: no clipping, since side panels render inside this list for downshift to count their clicks as inside.
            overflowY: 'visible',
            maxH: 'none',
          }}
        >
          {isOpen ? (
            <>
              {addEmailItem ? (
                <AddEmailRow
                  item={addEmailItem}
                  index={items.indexOf(addEmailItem)}
                />
              ) : (
                <ListItem
                  role="none"
                  sx={{
                    ...styles.item,
                    cursor: 'default',
                    _hover: { bg: 'initial' },
                    _active: { bg: 'initial' },
                  }}
                >
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
      </Box>
    </FloatingPortal>
  )
}
