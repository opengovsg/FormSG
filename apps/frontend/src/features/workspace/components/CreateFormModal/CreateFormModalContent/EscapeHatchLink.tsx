import { Text } from '@chakra-ui/react'

import { composeEscapeHatchCopy } from '~utils/escapeHatchCopy'
import Link from '~components/Link'

import { useUser } from '~features/user/queries'

interface EscapeHatchLinkProps {
  onClick: () => void
}

export const EscapeHatchLink = ({
  onClick,
}: EscapeHatchLinkProps): JSX.Element => {
  const { user } = useUser()
  const { prefix, linkText, suffix } = composeEscapeHatchCopy(user?.betaFlags)
  return (
    <Text textStyle="body-2" color="secondary.500">
      {prefix}
      <Link cursor="pointer" onClick={onClick}>
        {linkText}
      </Link>
      {suffix}
    </Text>
  )
}
