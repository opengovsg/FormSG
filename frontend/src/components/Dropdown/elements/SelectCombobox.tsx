import { useMemo } from 'react'
import { Flex, InputGroup, useMultiStyleConfig } from '@chakra-ui/react'

import Input from '~components/Input'

import { useSelectContext } from '../SelectContext'
import { itemToIcon } from '../utils/itemUtils'

import { LabelIcon } from './LabelIcon'
import { ToggleChevron } from './ToggleChevron'

export const SelectCombobox = (): JSX.Element => {
  const {
    getComboboxProps,
    isOpen,
    toggleMenu,
    selectedItem,
    getInputProps,
    getToggleButtonProps,
  } = useSelectContext()

  const selectedItemIcon = useMemo(
    () => itemToIcon(selectedItem),
    [selectedItem],
  )

  const styles = useMultiStyleConfig('Combobox', {})

  return (
    <Flex>
      <InputGroup pos="relative" {...getComboboxProps()}>
        {selectedItemIcon ? (
          <LabelIcon sx={styles.icon} icon={selectedItemIcon} />
        ) : null}
        <Input
          sx={styles.field}
          {...getInputProps({
            onClick: toggleMenu,
          })}
        />
        <ToggleChevron
          isOpen={isOpen}
          sx={styles.icon}
          {...getToggleButtonProps()}
        />
      </InputGroup>
    </Flex>
  )
}
