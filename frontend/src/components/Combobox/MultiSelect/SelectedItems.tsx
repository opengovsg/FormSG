import { Wrap, WrapItem } from '@chakra-ui/react'
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
    <Wrap
      align="center"
      direction="row"
      spacing="0.25rem"
      p="0.375rem"
      marginEnd="-0.375rem"
      maxW="100%"
    >
      {selectedItems.map((selectedItem, index) => (
        <WrapItem maxW="calc(100% - 0.25rem)" key={`selected-item-${index}`}>
          <SelectedItemTag
            label={itemToLabelString(selectedItem)}
            {...getSelectedItemProps({
              selectedItem,
              index,
              tabIndex: -1,
              disabled: isDisabled,
            })}
            isDisabled={isDisabled}
            onRemove={() => handleRemoveItem(selectedItem)}
          />
        </WrapItem>
      ))}
    </Wrap>
  )
}
