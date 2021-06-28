import { useMemo } from 'react'
import { BiX } from 'react-icons/bi'
import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown/src/ast-to-react'
import {
  Box,
  CloseButton,
  Collapse,
  Container,
  Flex,
  Icon,
  useDisclosure,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { BxsInfoCircle } from '~assets/icons/BxsInfoCircle'
import { BannerVariant } from '~theme/components/Banner'

import Link from '../Link'

export interface BannerProps {
  variant?: BannerVariant
  children: string
}

export const Banner = ({ variant, children }: BannerProps): JSX.Element => {
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
        <Container sx={styles.item}>
          <Flex>
            <Icon as={BxsInfoCircle} __css={styles.icon} />
            <ReactMarkdown components={mdComponents}>{children}</ReactMarkdown>
          </Flex>
          {variant === 'info' && (
            <CloseButton
              __css={styles.close}
              children={<BiX />}
              onClick={onToggle}
            />
          )}
        </Container>
      </Box>
    </Collapse>
  )
}
