import { Flex, FlexProps, Icon, useMultiStyleConfig } from '@chakra-ui/react'

import { BxsErrorCircle, BxsInfoCircle } from '~/assets/icons'
import { InlineMessageVariant } from '~/theme/components/InlineMessage'

import { useMdComponents } from '~hooks/useMdComponents'
import { MarkdownText } from '~components/MarkdownText'

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
        aria-label={`${variant !== 'error' ? 'Info' : 'Error'} message icon`}
      />
      {useMarkdown && typeof children === 'string' ? (
        <MarkdownText components={mdComponents}>{children}</MarkdownText>
      ) : (
        children
      )}
    </Flex>
  )
}
