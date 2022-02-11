import { useMemo } from 'react'
import { Flex, Icon, ListItem, Stack, Text } from '@chakra-ui/react'

import { useSelectContext } from '~components/Dropdown/SelectContext'
import { ComboboxItem } from '~components/Dropdown/types'
import {
  itemToDescriptionString,
  itemToIcon,
  itemToLabelString,
} from '~components/Dropdown/utils/itemUtils'

import { DropdownItemTextHighlighter } from '../DropdownItem/DropdownItemTextHighlighter'

import { ItemCheckboxIcon } from './ItemCheckboxIcon'

export interface MultiDropdownItemProps {
  item: ComboboxItem
  index: number
}

export const MultiDropdownItem = ({
  item,
  index,
}: MultiDropdownItemProps): JSX.Element => {
  const {
    getItemProps,
    isItemSelected,
    highlightedIndex,
    styles,
    isDisabled,
    inputValue,
  } = useSelectContext()

  const { isSelected, isHighlighted, icon, label, description } = useMemo(
    () => ({
      isSelected: isItemSelected(item),
      isHighlighted: highlightedIndex === index,
      icon: itemToIcon(item),
      label: itemToLabelString(item),
      description: itemToDescriptionString(item),
    }),
    [highlightedIndex, index, isItemSelected, item],
  )

  return (
    <ListItem
      sx={styles.item}
      // Instantiating here as it provides a `ref` that doesn't seem to be able
      // to be forwarded.
      {...getItemProps({
        item,
        index,
        disabled: isDisabled,
      })}
    >
      <Stack direction="row" spacing="1rem">
        <ItemCheckboxIcon isChecked={isSelected} />
        <Flex flexDir="column">
          <Stack direction="row" spacing="0.5rem" align="center">
            {icon ? <Icon as={icon} sx={styles.icon} /> : null}
            <DropdownItemTextHighlighter
              inputValue={inputValue}
              showHoverBg={isHighlighted}
              textToHighlight={label}
            />
          </Stack>
          <Text
            textStyle="body-2"
            color={isSelected ? 'secondary.500' : 'secondary.400'}
          >
            {description}
          </Text>
        </Flex>
      </Stack>
    </ListItem>
  )
}
