import { useMemo } from 'react'
import {
  Box,
  CSSObject,
  Flex,
  Icon,
  ListItem,
  Stack,
  Text,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { UseComboboxPropGetters } from 'downshift'

import { BxCheckAnimated } from '~assets/icons'
import { CHECKBOX_THEME_KEY } from '~theme/components/Checkbox'

import { ComboboxItem } from './types'
import { itemToDescriptionString, itemToIcon, itemToLabelString } from './utils'

export interface MultiDropdownItemProps {
  item: ComboboxItem
  index: number
  isSelected?: boolean
  isDisabled?: boolean
  getItemProps: UseComboboxPropGetters<ComboboxItem>['getItemProps']
  itemStyles?: CSSObject
  iconStyles?: CSSObject
}

const CheckboxIcon = ({ isChecked }: { isChecked?: boolean }) => {
  const styles = useMultiStyleConfig(CHECKBOX_THEME_KEY, {})

  return (
    <Box
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      verticalAlign="top"
      userSelect="none"
      flexShrink={0}
      __css={styles.control}
      data-checked={isChecked || undefined}
    >
      <Icon as={BxCheckAnimated} __css={styles.icon} isChecked={isChecked} />
    </Box>
  )
}

export const MultiDropdownItem = ({
  item,
  isSelected,
  isDisabled,
  index,
  getItemProps,
  itemStyles,
  iconStyles,
}: MultiDropdownItemProps): JSX.Element => {
  const itemMeta = useMemo(
    () => ({
      icon: itemToIcon(item),
      label: itemToLabelString(item),
      description: itemToDescriptionString(item),
    }),
    [item],
  )

  return (
    <ListItem
      sx={itemStyles}
      // Instantiating here as it provides a `ref` that doesn't seem to be able
      // to be forwarded.
      {...getItemProps({
        item,
        index,
        disabled: isDisabled,
      })}
    >
      <Flex flexDir="column">
        <Stack direction="row" align="center" spacing="1rem">
          <CheckboxIcon isChecked={isSelected} />
          {itemMeta.icon ? <Icon as={itemMeta.icon} sx={iconStyles} /> : null}
          <Text>{itemMeta.label}</Text>
        </Stack>
        <Text
          textStyle="body-2"
          color={isSelected ? 'secondary.500' : 'secondary.400'}
        >
          {itemMeta.description}
        </Text>
      </Flex>
    </ListItem>
  )
}
