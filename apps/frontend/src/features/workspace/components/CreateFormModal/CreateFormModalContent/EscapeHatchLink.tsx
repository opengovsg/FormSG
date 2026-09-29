import { useTranslation } from 'react-i18next'
import { Text } from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'

// TODO [MRF-CUTOVER]: Remove after cutover.
const KEY = 'features.workspace.modals.forms.create.escapeHatch'

interface EscapeHatchLinkProps {
  onClick: () => void
}

export const EscapeHatchLink = ({
  onClick,
}: EscapeHatchLinkProps): JSX.Element => {
  const { t } = useTranslation()
  return (
    <InlineMessage variant="info">
      <Text>
        {t(`${KEY}.prefix`)}
        <Link cursor="pointer" onClick={onClick}>
          {t(`${KEY}.linkText`)}
        </Link>
        {t(`${KEY}.suffix`)}
      </Text>
    </InlineMessage>
  )
}
