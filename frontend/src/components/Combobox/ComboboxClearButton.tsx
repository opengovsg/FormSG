import { BiX } from 'react-icons/bi'
import { Button, IconButtonProps, useStyles } from '@chakra-ui/react'

export type ComboboxClearButtonProps = IconButtonProps

export const ComboboxClearButton = (
  props: ComboboxClearButtonProps,
): JSX.Element => {
  const styles = useStyles()
  return (
    <Button sx={styles.clearbutton} {...props}>
      <BiX fontSize="1.25rem" />
    </Button>
  )
}
