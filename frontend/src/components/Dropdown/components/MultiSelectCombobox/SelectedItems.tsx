import { MouseEvent, useCallback, useMemo } from 'react'

import Button from '~components/Button'
import { useMultiSelectContext } from '~components/Dropdown/MultiSelectContext'
import { useSelectContext } from '~components/Dropdown/SelectContext'

import { MultiSelectItem } from '../MultiSelectItem'

const ShowMoreItemBlock = ({ amountToShow }: { amountToShow: number }) => {
  const { isDisabled, isReadOnly, setIsFocused, inputRef } = useSelectContext()

  const handleClick = useCallback(
    (e: MouseEvent) => {
      // Prevent click from bubbling to parent.
      e.stopPropagation()
      if (isDisabled || isReadOnly) return
      setIsFocused(true)
      inputRef?.current?.focus()
    },
    [inputRef, isDisabled, isReadOnly, setIsFocused],
  )

  return (
    <Button onClick={handleClick} variant="link" size="sm" tabIndex={-1}>
      +{amountToShow} more
    </Button>
  )
}

export const SelectedItems = (): JSX.Element => {
  const { selectedItems, maxItems, isSelectedItemFullWidth } =
    useMultiSelectContext()
  const { isFocused } = useSelectContext()

  const items = useMemo(() => {
    const itemsToRender = []
    for (let i = 0; i < selectedItems.length; i++) {
      if (isFocused || !maxItems || i < maxItems) {
        const item = selectedItems[i]
        // Key has to be index so focus is maintained correctly when items are removed.
        // Some downshift quirk it seems.
        itemsToRender.push(
          <MultiSelectItem
            item={item}
            index={i}
            key={i}
            w={isSelectedItemFullWidth ? '100%' : undefined}
          />,
        )
      } else {
        itemsToRender.push(
          <ShowMoreItemBlock
            amountToShow={selectedItems.length - maxItems}
            key={`show-more-${i}`}
          />,
        )
        break
      }
    }
    return itemsToRender
  }, [isFocused, isSelectedItemFullWidth, maxItems, selectedItems])

  return <>{items}</>
}
