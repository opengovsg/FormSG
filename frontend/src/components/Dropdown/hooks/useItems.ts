// Hook to normalize item array for easy filtering and checking of state

import { useCallback, useMemo } from 'react'

import { ComboboxItem } from '../types'
import { itemToValue } from '../utils/itemUtils'

export type ItemWithIndex<Item extends ComboboxItem = ComboboxItem> = {
  item: Item
  index: number
}

export type UseItemsReturn<
  Item extends ComboboxItem = ComboboxItem,
  Value extends string = string,
> = {
  items: Item[]
  normalized: {
    allValues: string[]
    byValue: Record<Value, ItemWithIndex<Item>>
  }
}

export const useItems = <
  Item extends ComboboxItem = ComboboxItem,
  Value extends string = string,
>(
  rawItems: Item[],
) => {
  const normalizedItems = useMemo(() => {
    const initialStore: UseItemsReturn<Item> = {
      // All selectable items
      items: [],

      // Normalized store for filtering and retrieval of state
      normalized: {
        allValues: [],
        byValue: {},
      },
    }

    let itemIndex = 0

    return rawItems.reduce((store, item) => {
      const value = itemToValue(item)
      // Do nothing if no value.
      if (!value) {
        return store
      }

      store.items.push(item)
      store.normalized.allValues.push(value)
      store.normalized.byValue[value] = {
        item,
        index: itemIndex,
      }

      // Only increment if item has a value.
      itemIndex++
      return store
    }, initialStore)
  }, [rawItems])

  const getItemByValue = useCallback(
    (value: Value): ItemWithIndex<Item> | null => {
      return normalizedItems.normalized.byValue[value] ?? null
    },
    [normalizedItems.normalized.byValue],
  )

  const mapDropdownItems = useCallback(
    (callback: (itemElement: ItemWithIndex<Item>) => JSX.Element) => {
      return normalizedItems.normalized.allValues.map((value) => {
        const item = normalizedItems.normalized.byValue[value]
        return callback(item)
      })
    },
    [normalizedItems.normalized.allValues, normalizedItems.normalized.byValue],
  )

  return {
    items: normalizedItems.items,
    getItemByValue,
    mapDropdownItems,
  }
}
