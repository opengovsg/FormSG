import { useCallback } from 'react'
import { BiX } from 'react-icons/bi'
import { chakra } from '@chakra-ui/react'

import { useSelectContext } from '../../SelectContext'

export const ComboboxClearButton = (): JSX.Element | null => {
  const {
    isClearable,
    isDisabled,
    clearButtonLabel,
    selectItem,
    styles,
    inputValue,
  } = useSelectContext()

  const handleClearSelection = useCallback(() => selectItem(null), [selectItem])

  if (!isClearable) return null

  return (
    <chakra.button
      // Prevent form submission from triggering this button.
      type="button"
      disabled={isDisabled}
      aria-label={clearButtonLabel}
      onClick={handleClearSelection}
      __css={styles.clearbutton}
      color={inputValue ? 'secondary.500' : undefined}
    >
      <BiX fontSize="1.25rem" />
    </chakra.button>
  )
}
