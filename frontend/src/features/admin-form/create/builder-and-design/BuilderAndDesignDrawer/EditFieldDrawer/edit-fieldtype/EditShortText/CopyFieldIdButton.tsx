import { BiCheck, BiCopy } from 'react-icons/bi'
import { Icon, useClipboard } from '@chakra-ui/react'

import IconButton, { IconButtonProps } from '~components/IconButton'

export interface CopyFieldIdButtonProps
  extends Omit<IconButtonProps, 'aria-label'> {
  fieldId: string
}

export const CopyFieldIdButton = ({
  fieldId,
  ...iconButtonProps
}: CopyFieldIdButtonProps): JSX.Element => {
  const { onCopy, hasCopied } = useClipboard(fieldId)

  return hasCopied ? (
    <Icon as={BiCheck} color="success.700" fontSize="1.5rem" />
  ) : (
    <IconButton
      variant="clear"
      colorScheme="neutral"
      w="2rem"
      size="sm"
      icon={<BiCopy fontSize="1.25rem" />}
      aria-label="Copy field id value"
      onClick={onCopy}
      {...iconButtonProps}
    />
  )
}
