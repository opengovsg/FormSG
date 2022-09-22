import { useCallback, useEffect, useState } from 'react'
import { BiX } from 'react-icons/bi'
import { chakra, VisuallyHidden } from '@chakra-ui/react'

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
    inputRef,
    selectedItem,
  } = useSelectContext()

  const [announceClearedInput, setAnnounceClearedInput] = useState(false)
  const handleClearSelection = useCallback(() => {
    selectItem(null)
    inputRef?.current?.focus()
    setAnnounceClearedInput(true)
  }, [inputRef, selectItem])

  useEffect(() => {
    if (selectedItem) {
      setAnnounceClearedInput(false)
    }
  }, [inputRef, selectedItem])

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
      {announceClearedInput && (
        <VisuallyHidden aria-live="assertive">
          Selection has been cleared
        </VisuallyHidden>
      )}
      <BiX fontSize="1.25rem" />
    </chakra.button>
  )
}
