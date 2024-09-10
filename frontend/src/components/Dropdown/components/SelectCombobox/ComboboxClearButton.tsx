import { useCallback, useEffect, useState } from 'react'
import { BiX } from 'react-icons/bi'
import { Flex, VisuallyHidden } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

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
    // Need to focus before selecting null. I have no idea why, but it works
    inputRef?.current?.focus()
    selectItem(null)
    setAnnounceClearedInput(true)
  }, [inputRef, selectItem])

  useEffect(() => {
    if (selectedItem) {
      setAnnounceClearedInput(false)
    }
  }, [inputRef, selectedItem])

  if (!isClearable) return null

  return (
    <Flex justifyContent="center">
      <IconButton
        // Prevent form submission from triggering this button.
        type="button"
        isDisabled={isDisabled || isReadOnly}
        aria-label={clearButtonLabel}
        onClick={handleClearSelection}
        // Unmount the visually hidden announcement when navigated to this button
        onFocus={() => setAnnounceClearedInput(false)}
        variant="inputAttached"
        icon={<BiX fontSize="1.25rem" />}
        isActive={!!inputValue || !!selectedItem}
        sx={styles.clearbutton}
      />
      {announceClearedInput && (
        <VisuallyHidden aria-live="assertive">
          Selection has been cleared
        </VisuallyHidden>
      )}
    </Flex>
  )
}
