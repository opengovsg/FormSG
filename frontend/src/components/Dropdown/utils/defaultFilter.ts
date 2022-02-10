import { matchSorter } from 'match-sorter'

import { ComboboxItem } from '../types'

import { itemIsObject } from './itemUtils'

export const defaultFilter = <Item extends ComboboxItem>(
  items: Item[],
  value: string,
) => {
  const item = items[0]
  if (!item) return items
  const matchSorterOptions = itemIsObject(item)
    ? { keys: ['value', 'label', 'description'] }
    : {}
  return matchSorter(items, value, matchSorterOptions)
}
