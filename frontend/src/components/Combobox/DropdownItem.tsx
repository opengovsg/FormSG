import { useMemo } from 'react'
import Highlighter from 'react-highlight-words'
import {
  chakra,
  CSSObject,
  Flex,
  Icon,
  ListItem,
  Stack,
  Text,
} from '@chakra-ui/react'
import { UseComboboxPropGetters } from 'downshift'
import escapeRegExp from 'lodash/escapeRegExp'

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
  isSelected: boolean
  getItemProps: UseComboboxPropGetters<ComboboxItem>['getItemProps']
  itemStyles?: CSSObject
  iconStyles?: CSSObject
  /** Current input value in dropdown for highlighting of matched text */
  inputValue: string
}

const DropdownHighlightMark = ({
  showHoverBg,
  children,
  ...props
}: {
  showHoverBg: boolean
  children: string
}) => (
  <chakra.mark
    bg={showHoverBg ? 'primary.200' : 'primary.100'}
    transitionProperty="background"
    transitionDuration="ultra-fast"
    transitionTimingFunction="ease-in"
    color="primary.500"
    {...props}
  >
    {children}
  </chakra.mark>
)

export const DropdownItem = ({
  item,
  isActive,
  isSelected,
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

  /**
   * Allows for fuzzy matching of searched characters, resulting in better UX.
   * E.g. searching for `'rb'` will highlight `r` and `b` in `"radio button"`.
   */
  const regexSearchWords = useMemo(
    () => [new RegExp(`[${escapeRegExp(inputValue)}]`, 'gi')],
    [inputValue],
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
          <Text>
            <Highlighter
              searchWords={regexSearchWords}
              highlightTag={({ children }) => (
                <DropdownHighlightMark
                  children={children}
                  showHoverBg={isSelected && !isActive}
                />
              )}
              textToHighlight={itemMeta.label}
            />
          </Text>
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
