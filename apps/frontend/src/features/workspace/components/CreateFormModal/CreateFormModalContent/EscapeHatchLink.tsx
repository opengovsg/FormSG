import { useTranslation } from 'react-i18next'
import { Text } from '@chakra-ui/react'

import { composeEscapeHatchCopy } from '~utils/escapeHatchCopy'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'

import { useUser } from '~features/user/queries'

interface EscapeHatchLinkProps {
  onClick: () => void
}

export const EscapeHatchLink = ({
  onClick,
}: EscapeHatchLinkProps): JSX.Element => {
  const { t } = useTranslation()
  const { user } = useUser()
  const { prefix, linkText, suffix } = composeEscapeHatchCopy(
    t,
    user?.betaFlags,
  )
  return (
    <InlineMessage variant="info">
      <Text>
        {prefix}
        <Link cursor="pointer" onClick={onClick}>
          {linkText}
        </Link>
        {suffix}
      </Text>
    </InlineMessage>
  )
}
