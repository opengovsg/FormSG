import { useMemo } from 'react'

import Button from '~components/Button'
import { useMultiSelectContext } from '~components/Dropdown/MultiSelectContext'
import { useSelectContext } from '~components/Dropdown/SelectContext'
import { itemToValue } from '~components/Dropdown/utils/itemUtils'

import { MultiSelectItem } from '../MultiSelectItem'

const ShowMoreItemBlock = ({ amountToShow }: { amountToShow: number }) => {
  return (
    <Button as="span" variant="link" size="sm">
      +{amountToShow} more
    </Button>
  )
}

export const SelectedItems = (): JSX.Element => {
  const { selectedItems, maxItems } = useMultiSelectContext()
  const { isFocused } = useSelectContext()

  const items = useMemo(() => {
    const itemsToRender = []
    for (let i = 0; i < selectedItems.length; i++) {
      if (isFocused || !maxItems || i < maxItems) {
        const item = selectedItems[i]
        itemsToRender.push(
          <MultiSelectItem
            item={item}
            index={i}
            key={`${itemToValue(item)}${i}`}
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
  }, [isFocused, maxItems, selectedItems])

  return <>{items}</>
}
