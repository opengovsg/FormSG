import ReactMarkdown from 'react-markdown'
import { Flex, FlexProps, Icon, useMultiStyleConfig } from '@chakra-ui/react'

import { BxsErrorCircle, BxsInfoCircle } from '~/assets/icons'
import { InlineMessageVariant } from '~/theme/components/InlineMessage'

import { useMdComponents } from '~hooks/useMdComponents'

export interface InlineMessageProps extends FlexProps {
  variant?: InlineMessageVariant
  useMarkdown?: boolean
}

export const InlineMessage = ({
  variant = 'info',
  children,
  useMarkdown = false,
  ...flexProps
}: InlineMessageProps): JSX.Element => {
  const styles = useMultiStyleConfig('InlineMessage', { variant })

  const mdComponents = useMdComponents({ styles })

  return (
    <Flex sx={styles.messagebox} {...flexProps}>
      <Icon
        as={variant !== 'error' ? BxsInfoCircle : BxsErrorCircle}
        __css={styles.icon}
      />
      {useMarkdown && typeof children === 'string' ? (
        <ReactMarkdown components={mdComponents}>{children}</ReactMarkdown>
      ) : (
        children
      )}
    </Flex>
  )
}
