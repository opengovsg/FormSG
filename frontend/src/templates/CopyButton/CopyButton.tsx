import { BiCheck, BiCopy } from 'react-icons/bi'
import { Icon, useClipboard } from '@chakra-ui/react'
import { IconButton, IconButtonProps } from '@opengovsg/design-system-react'

export interface CopyFieldIdButtonProps extends IconButtonProps {
  stringToCopy: string
}

export const CopyButton = ({
  stringToCopy,
  ...iconButtonProps
}: CopyFieldIdButtonProps): JSX.Element => {
  const { onCopy, hasCopied } = useClipboard(stringToCopy)

  return hasCopied ? (
    <Icon as={BiCheck} color="success.700" fontSize="1.5rem" />
  ) : (
    <IconButton
      variant="clear"
      colorScheme="neutral"
      w="2rem"
      size="sm"
      icon={<BiCopy fontSize="1.25rem" />}
      onClick={onCopy}
      {...iconButtonProps}
    />
  )
}
