import { isString } from '@chakra-ui/utils'
import { matchSorter } from 'match-sorter'

import { ComboboxItem } from './types'

const itemIsObject = (
  item: ComboboxItem,
): item is Exclude<ComboboxItem, string | null> => {
  return !!item && !isString(item)
}

export const defaultFilter = <Item extends ComboboxItem>(
  items: Item[],
  value: string,
) => {
  return matchSorter(items, value, { keys: ['value', 'label'] })
}

export const itemToLabelString = <Item extends ComboboxItem>(
  item: Item,
): string => {
  if (!itemIsObject(item)) {
    return item ?? ''
  }
  return item.label ?? item.value
}

export const itemToIcon = <Item extends ComboboxItem>(item?: Item) => {
  if (!item || !itemIsObject(item)) {
    return undefined
  }
  return item.icon
}

export const isItemDisabled = <Item extends ComboboxItem>(
  item: Item,
): boolean => {
  return itemIsObject(item) && !!item.disabled
}

export const itemToDescriptionString = <Item extends ComboboxItem>(
  item: Item,
): string | undefined => {
  return itemIsObject(item) ? item.description : undefined
}
