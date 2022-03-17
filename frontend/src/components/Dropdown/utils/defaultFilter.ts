import { matchSorter, MatchSorterOptions } from 'match-sorter'

import { ComboboxItem } from '../types'

import { itemIsObject } from './itemUtils'

export const defaultFilter = <Item extends ComboboxItem>(
  items: Item[],
  value: string,
) => {
  const item = items[0]
  if (!item) return items
  let matchSorterOptions: MatchSorterOptions<Item> = {}
  if (itemIsObject(item)) {
    const sortKeys: string[] = []

    // Use label to sort if it exists, else use value.
    // Do not use both since users may search by label and get confused when
    // value (that may not be the same as the label) shows up.
    if (item.label) {
      sortKeys.push('label')
    } else {
      sortKeys.push('value')
    }
    sortKeys.push('description')
    matchSorterOptions = { keys: sortKeys }
  }
  return matchSorter(items, value, matchSorterOptions)
}
