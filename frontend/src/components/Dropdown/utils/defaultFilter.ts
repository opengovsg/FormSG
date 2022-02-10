import { matchSorter } from 'match-sorter'

import { ComboboxItem } from '../types'

export const defaultFilter = <Item extends ComboboxItem>(
  items: Item[],
  value: string,
) => {
  return matchSorter(items, value, { keys: ['value', 'label'] })
}
