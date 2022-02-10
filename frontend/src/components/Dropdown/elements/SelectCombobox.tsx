import { useMemo } from 'react'
import { Flex, InputGroup } from '@chakra-ui/react'

import Input from '~components/Input'

import { useSelectContext } from '../SelectContext'
import { itemToIcon } from '../utils/itemUtils'

import { ComboboxClearButton } from './ComboboxClearButton'
import { LabelIcon } from './LabelIcon'
import { ToggleChevron } from './ToggleChevron'

export const SelectCombobox = (): JSX.Element => {
  const {
    getComboboxProps,
    toggleMenu,
    selectedItem,
    getInputProps,
    styles,
    isDisabled,
    isSearchable,
    isReadOnly,
    isInvalid,
    isRequired,
    placeholder,
  } = useSelectContext()

  const selectedItemIcon = useMemo(
    () => itemToIcon(selectedItem),
    [selectedItem],
  )

  return (
    <Flex>
      <InputGroup
        pos="relative"
        {...getComboboxProps({
          disabled: isDisabled,
          readOnly: isReadOnly,
          required: isRequired,
        })}
      >
        {selectedItemIcon ? <LabelIcon icon={selectedItemIcon} /> : null}
        <Input
          isReadOnly={!isSearchable || isReadOnly}
          isInvalid={isInvalid}
          isDisabled={isDisabled}
          placeholder={placeholder}
          sx={styles.field}
          {...getInputProps({
            onClick: toggleMenu,
          })}
        />
        <ToggleChevron />
      </InputGroup>
      <ComboboxClearButton />
    </Flex>
  )
}
