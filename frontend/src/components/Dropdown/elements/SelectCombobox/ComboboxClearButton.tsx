import { useCallback } from 'react'
import { BiX } from 'react-icons/bi'
import { Button } from '@chakra-ui/react'

import { useSelectContext } from '../../SelectContext'

export const ComboboxClearButton = (): JSX.Element | null => {
  const { isClearable, isDisabled, clearButtonLabel, selectItem, styles } =
    useSelectContext()

  const handleClearSelection = useCallback(() => selectItem(null), [selectItem])

  if (!isClearable) return null

  return (
    <Button
      isDisabled={isDisabled}
      aria-label={clearButtonLabel}
      onClick={handleClearSelection}
      sx={styles.clearbutton}
    >
      <BiX fontSize="1.25rem" />
    </Button>
  )
}
