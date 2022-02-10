import { useCallback, useMemo } from 'react'
import { Flex, InputGroup, useMultiStyleConfig } from '@chakra-ui/react'

import Input from '~components/Input'

import { useSelectContext } from '../SelectContext'
import { itemToIcon } from '../utils/itemUtils'

import { ComboboxClearButton } from './ComboboxClearButton'
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
    isClearable,
    isDisabled,
    clearButtonLabel,
    selectItem,
  } = useSelectContext()

  const selectedItemIcon = useMemo(
    () => itemToIcon(selectedItem),
    [selectedItem],
  )

  const handleClearSelection = useCallback(() => selectItem(null), [selectItem])

  const styles = useMultiStyleConfig('Combobox', { isClearable })

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
      {isClearable ? (
        <ComboboxClearButton
          isDisabled={isDisabled}
          aria-label={clearButtonLabel}
          onClick={handleClearSelection}
        />
      ) : null}
    </Flex>
  )
}
