import { ComboboxItem } from '../types'

export const itemIsObject = (
  item: ComboboxItem,
): item is Exclude<ComboboxItem, string | null> => {
  return !!item && typeof item !== 'string'
}

export const itemToValue = <Item extends ComboboxItem>(item?: Item): string => {
  if (!item) return ''
  if (!itemIsObject(item)) {
    return item
  }
  return item.value
}

export const itemToLabelString = <Item extends ComboboxItem>(
  item?: Item,
): string => {
  if (!item) return ''
  if (!itemIsObject(item)) {
    return item
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

/**
 * Items flagged with `isAction` trigger an action instead of being selected as
 * a value, so a multiselect renders them without a checkbox. Opt-in: items that
 * do not set it keep the existing rendering.
 */
export const isItemAction = <Item extends ComboboxItem>(
  item: Item,
): boolean => {
  return itemIsObject(item) && !!item.isAction
}

export const itemToDescriptionString = <Item extends ComboboxItem>(
  item: Item,
): string | undefined => {
  return itemIsObject(item) ? item.description : undefined
}
