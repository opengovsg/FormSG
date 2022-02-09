import { BiX } from 'react-icons/bi'
import { useStyles } from '@chakra-ui/react'

import IconButton, { IconButtonProps } from '~components/IconButton'

export type ComboboxClearButtonProps = IconButtonProps

export const ComboboxClearButton = (
  props: ComboboxClearButtonProps,
): JSX.Element => {
  const styles = useStyles()
  return <IconButton sx={styles.clearbutton} icon={<BiX />} {...props} />
}
