import { useMemo } from 'react'
import { CSSObject, Flex, Icon, ListItem, Stack, Text } from '@chakra-ui/react'
import { UseComboboxPropGetters } from 'downshift'

import { DropdownItemTextHighlighter } from './DropdownItemTextHighlighter'
import { ComboboxItem } from './types'
import {
  isItemDisabled,
  itemToDescriptionString,
  itemToIcon,
  itemToLabelString,
} from './utils'

export interface DropdownItemProps {
  item: ComboboxItem
  index: number
  isActive?: boolean
  isHighlighted: boolean
  getItemProps: UseComboboxPropGetters<ComboboxItem>['getItemProps']
  itemStyles?: CSSObject
  iconStyles?: CSSObject
  /** Current input value in dropdown for highlighting of matched text */
  inputValue: string
}

export const DropdownItem = ({
  item,
  isActive,
  isHighlighted,
  index,
  getItemProps,
  itemStyles,
  iconStyles,
  inputValue,
}: DropdownItemProps): JSX.Element => {
  const itemMeta = useMemo(
    () => ({
      icon: itemToIcon(item),
      label: itemToLabelString(item),
      description: itemToDescriptionString(item),
      disabled: isItemDisabled(item),
    }),
    [item],
  )

  return (
    <ListItem
      sx={itemStyles}
      // Data attributes are unique, any value will be truthy.
      // We want to not even have the tag if falsey.
      // This adds _active styling to the item.
      data-active={isActive}
      // Instantiating here as it provides a `ref` that doesn't seem to be able
      // to be forwarded.
      {...getItemProps({
        item,
        index,
        disabled: itemMeta.disabled,
      })}
    >
      <Flex flexDir="column">
        <Stack direction="row" align="center" spacing="1rem">
          {itemMeta.icon ? <Icon as={itemMeta.icon} sx={iconStyles} /> : null}
          <DropdownItemTextHighlighter
            inputValue={inputValue}
            showHoverBg={isHighlighted && !isActive}
            textToHighlight={itemMeta.label}
          />
        </Stack>
        <Text
          textStyle="body-2"
          color={isActive ? 'secondary.500' : 'secondary.400'}
        >
          {itemMeta.description}
        </Text>
      </Flex>
    </ListItem>
  )
}
