import { useMemo } from 'react'
import { BiX } from 'react-icons/bi'
import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown/src/ast-to-react'
import {
  Box,
  CloseButton,
  Collapse,
  Flex,
  Icon,
  useDisclosure,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { BxsErrorCircle, BxsInfoCircle } from '~/assets/icons'

import { BannerVariant } from '~theme/components/Banner'

import Link from '../Link'

export interface BannerProps {
  variant?: BannerVariant
  children: string
  useMarkdown: boolean
}

export const Banner = ({
  variant = 'info',
  children,
  useMarkdown = false,
}: BannerProps): JSX.Element => {
  const { isOpen, onToggle } = useDisclosure({
    defaultIsOpen: true,
  })

  const styles = useMultiStyleConfig('Banner', { variant })

  const mdComponents: Components = useMemo(
    () => ({
      a: (props) => {
        const { href } = props
        const isExternal =
          typeof href === 'string' && !href.startsWith(window.location.origin)

        return <Link {...props} isExternal={isExternal} sx={styles.link} />
      },
    }),
    [styles.link],
  )

  return (
    <Collapse in={isOpen} animateOpacity>
      <Box __css={styles.banner}>
        <Flex sx={styles.item}>
          <Flex>
            <Icon
              as={variant === 'info' ? BxsInfoCircle : BxsErrorCircle}
              __css={styles.icon}
            />
            {useMarkdown ? (
              <ReactMarkdown components={mdComponents}>
                {children}
              </ReactMarkdown>
            ) : (
              children
            )}
          </Flex>
          {variant === 'info' && (
            <CloseButton
              __css={styles.close}
              children={<BiX />}
              onClick={onToggle}
            />
          )}
        </Flex>
      </Box>
    </Collapse>
  )
}
