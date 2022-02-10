import { useMemo } from 'react'
import { Flex, Icon, ListItem, Stack, Text } from '@chakra-ui/react'

import { useSelectContext } from '~components/Dropdown/SelectContext'

import { ComboboxItem } from '../../types'
import {
  isItemDisabled,
  itemToDescriptionString,
  itemToIcon,
  itemToLabelString,
} from '../../utils/itemUtils'

import { DropdownItemTextHighlighter } from './DropdownItemTextHighlighter'

export interface DropdownItemProps {
  item: ComboboxItem
  index: number
}

export const DropdownItem = ({
  item,
  index,
}: DropdownItemProps): JSX.Element => {
  const { getItemProps, isItemSelected, inputValue, highlightedIndex, styles } =
    useSelectContext()

  const { icon, label, description, isDisabled, isHighlighted, isActive } =
    useMemo(
      () => ({
        icon: itemToIcon(item),
        label: itemToLabelString(item),
        description: itemToDescriptionString(item),
        isDisabled: isItemDisabled(item),
        isHighlighted: highlightedIndex === index,
        isActive: isItemSelected(item),
      }),
      [highlightedIndex, index, isItemSelected, item],
    )

  return (
    <ListItem
      sx={styles.item}
      // Instantiating here as it provides a `ref` that doesn't seem to be able
      // to be forwarded.
      // Data attributes are unique, any value will be truthy.
      // We want to not even have the tag if falsey.
      // This adds _active styling to the item.
      data-active={isActive || undefined}
      {...getItemProps({
        item,
        index,
        disabled: isDisabled,
      })}
    >
      <Flex flexDir="column">
        <Stack direction="row" align="center" spacing="1rem">
          {icon ? <Icon as={icon} sx={styles.icon} /> : null}
          <DropdownItemTextHighlighter
            inputValue={inputValue ?? ''}
            showHoverBg={isHighlighted && !isActive}
            textToHighlight={label}
          />
        </Stack>
        <Text
          textStyle="body-2"
          color={isActive ? 'secondary.500' : 'secondary.400'}
        >
          {description}
        </Text>
      </Flex>
    </ListItem>
  )
}
