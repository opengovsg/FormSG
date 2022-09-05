import { useCallback } from 'react'
import { BiX } from 'react-icons/bi'
import { chakra } from '@chakra-ui/react'

import { useSelectContext } from '../../SelectContext'

export const ComboboxClearButton = (): JSX.Element | null => {
  const {
    isClearable,
    isDisabled,
    isReadOnly,
    clearButtonLabel,
    selectItem,
    styles,
    inputValue,
    selectedItem,
  } = useSelectContext()

  const handleClearSelection = useCallback(() => selectItem(null), [selectItem])

  if (!isClearable) return null

  return (
    <chakra.button
      // Prevent form submission from triggering this button.
      type="button"
      disabled={isDisabled || isReadOnly}
      aria-label={clearButtonLabel}
      onClick={handleClearSelection}
      __css={styles.clearbutton}
      color={inputValue || selectedItem ? 'secondary.500' : undefined}
    >
      <BiX fontSize="1.25rem" />
    </chakra.button>
  )
}
