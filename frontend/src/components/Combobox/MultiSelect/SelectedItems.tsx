import { Wrap } from '@chakra-ui/react'
import { UseMultipleSelectionPropGetters } from 'downshift'

import { ComboboxItem } from '../types'
import { itemToLabelString } from '../utils'

import { SelectedItemTag } from './SelectedItemTag'

export interface SelectedItemsProps {
  selectedItems: ComboboxItem[]
  getSelectedItemProps: UseMultipleSelectionPropGetters<ComboboxItem>['getSelectedItemProps']
  handleRemoveItem: (item: ComboboxItem) => void
}

export const SelectedItems = ({
  selectedItems,
  handleRemoveItem,
  getSelectedItemProps,
}: SelectedItemsProps): JSX.Element | null => {
  if (selectedItems.length === 0) return null

  return (
    <Wrap
      shouldWrapChildren
      direction="row"
      spacing="0.25rem"
      p="0.375rem"
      marginEnd="-0.375rem"
    >
      {selectedItems.map((selectedItem, index) => (
        <SelectedItemTag
          key={`selected-item-${index}`}
          label={itemToLabelString(selectedItem)}
          {...getSelectedItemProps({ selectedItem, index })}
          onRemove={() => handleRemoveItem(selectedItem)}
        />
      ))}
    </Wrap>
  )
}
