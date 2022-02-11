import { MouseEvent, useCallback, useMemo } from 'react'
import { TagLabel } from '@chakra-ui/react'

import { useMultiSelectContext } from '~components/Dropdown/MultiSelectContext'
import { useSelectContext } from '~components/Dropdown/SelectContext'
import { ComboboxItem } from '~components/Dropdown/types'
import { itemToLabelString } from '~components/Dropdown/utils/itemUtils'
import { Tag, TagCloseButton } from '~components/Tag'

export interface MultiSelectItemProps<
  Item extends ComboboxItem = ComboboxItem,
> {
  item: Item
  index: number
}

export const MultiSelectItem = ({
  item,
  index,
}: MultiSelectItemProps): JSX.Element => {
  const { isDisabled } = useSelectContext()
  const { getSelectedItemProps, removeSelectedItem } = useMultiSelectContext()

  const itemLabel = useMemo(() => itemToLabelString(item), [item])
  const handleRemoveItem = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      removeSelectedItem(item)
    },
    [item, removeSelectedItem],
  )

  return (
    <Tag
      title={itemLabel}
      colorScheme="secondary"
      _focus={{
        boxShadow: '0 0 0 2px var(--chakra-colors-secondary-300)',
        _disabled: {
          boxShadow: 'none',
        },
      }}
      m="2px"
      {...getSelectedItemProps({
        selectedItem: item,
        index,
        disabled: isDisabled,
      })}
    >
      <TagLabel>{itemLabel}</TagLabel>
      <TagCloseButton tabIndex={-1} aria-hidden onClick={handleRemoveItem} />
    </Tag>
  )
}
