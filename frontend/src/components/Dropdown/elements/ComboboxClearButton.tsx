import { BiX } from 'react-icons/bi'
import { Button, IconButtonProps, useMultiStyleConfig } from '@chakra-ui/react'

import { useSelectContext } from '../SelectContext'

export type ComboboxClearButtonProps = IconButtonProps

export const ComboboxClearButton = (
  props: ComboboxClearButtonProps,
): JSX.Element => {
  const { isClearable } = useSelectContext()
  const styles = useMultiStyleConfig('Combobox', { isClearable })

  return (
    <Button sx={styles.clearbutton} {...props}>
      <BiX fontSize="1.25rem" />
    </Button>
  )
}
