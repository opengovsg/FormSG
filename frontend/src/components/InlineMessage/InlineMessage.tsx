import ReactMarkdown from 'react-markdown'
import { Flex, Icon, useMultiStyleConfig } from '@chakra-ui/react'

import { BxsErrorCircle, BxsInfoCircle } from '~/assets/icons'
import { InlineMessageVariant } from '~/theme/components/InlineMessage'

import { useMdComponents } from '~hooks/useMdComponents'

export type InlineMessageProps = {
  variant: InlineMessageVariant
  children: string
  useMarkdown: boolean
}

export const InlineMessage = ({
  variant = 'info',
  children,
  useMarkdown = false,
}: InlineMessageProps): JSX.Element => {
  const styles = useMultiStyleConfig('InlineMessage', { variant })

  const mdComponents = useMdComponents({ styles })

  return (
    <Flex sx={styles.messagebox}>
      <Icon
        as={variant !== 'error' ? BxsInfoCircle : BxsErrorCircle}
        __css={styles.icon}
      />
      {useMarkdown ? (
        <ReactMarkdown components={mdComponents}>{children}</ReactMarkdown>
      ) : (
        children
      )}
    </Flex>
  )
}
