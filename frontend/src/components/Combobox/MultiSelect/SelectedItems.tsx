import { UseMultipleSelectionPropGetters } from 'downshift'

import { ComboboxItem } from '../types'
import { itemToLabelString } from '../utils'

import { SelectedItemTag } from './SelectedItemTag'

export interface SelectedItemsProps {
  isDisabled?: boolean
  selectedItems: ComboboxItem[]
  getSelectedItemProps: UseMultipleSelectionPropGetters<ComboboxItem>['getSelectedItemProps']
  handleRemoveItem: (item: ComboboxItem) => void
}

export const SelectedItems = ({
  isDisabled,
  selectedItems,
  handleRemoveItem,
  getSelectedItemProps,
}: SelectedItemsProps): JSX.Element | null => {
  if (selectedItems.length === 0) return null

  return (
    <>
      {selectedItems.map((selectedItem, index) => (
        <SelectedItemTag
          key={`selected-item-${index}`}
          label={itemToLabelString(selectedItem)}
          {...getSelectedItemProps({
            selectedItem,
            index,
            disabled: isDisabled,
          })}
          isDisabled={isDisabled}
          onRemove={() => handleRemoveItem(selectedItem)}
        />
      ))}
    </>
  )
}
