import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown/src/ast-to-react'
import { Box, Flex, Icon, useMultiStyleConfig } from '@chakra-ui/react'

import { BxsErrorCircle, BxsInfoCircle } from '~/assets/icons'
import { InlineMessageVariant } from '~/theme/components/InlineMessage'

import Link from '../Link'

export type InlineMessageProps = {
  variant: InlineMessageVariant
  children: string
}

export const InlineMessage = ({
  variant = 'info',
  children,
}: InlineMessageProps): JSX.Element => {
  const styles = useMultiStyleConfig('InlineMessage', { variant })

  const mdComponents: Components = useMemo(
    () => ({
      a: (props) => {
        return <Link {...props} />
      },
    }),
    [],
  )

  return (
    <Box __css={styles.messagebox}>
      <Flex sx={styles.item}>
        <Icon
          as={variant !== 'error' ? BxsInfoCircle : BxsErrorCircle}
          __css={styles.icon}
        />
        <ReactMarkdown components={mdComponents}>{children}</ReactMarkdown>
      </Flex>
    </Box>
  )
}
