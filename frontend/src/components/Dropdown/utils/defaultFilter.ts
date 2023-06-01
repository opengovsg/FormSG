import fuzzysort from 'fuzzysort'

import { ComboboxItem } from '../types'

import { itemIsObject } from './itemUtils'

export const defaultFilter = <Item extends ComboboxItem>(
  items: Item[],
  value: string,
) => {
  const item = items[0]
  if (!item) return items

  const sortKeys: string[] = []
  if (itemIsObject(item)) {
    // Use label to sort if it exists, else use value.
    // Do not use both since users may search by label and get confused when
    // value (that may not be the same as the label) shows up.
    if (item.label) {
      sortKeys.push('label')
    } else {
      sortKeys.push('value')
    }
    sortKeys.push('description')

    return fuzzysort
      .go(value, items, {
        all: true,
        keys: sortKeys,
        // Create a custom combined score to sort by. -500 to the desc score makes it a worse match
        scoreFn: (a) => {
          return Math.max(
            a[0] ? a[0].score : -1000,
            a[1] ? a[1].score - 500 : -1000,
          )
        },
        threshold: -999,
      })
      .map((result) => result.obj)
  }

  // String search.
  return fuzzysort.go(value, items as string[]).map((result) => result.target)
}
