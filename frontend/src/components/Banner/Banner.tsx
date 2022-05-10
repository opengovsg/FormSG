import { BiX } from 'react-icons/bi'
import ReactMarkdown from 'react-markdown'
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
import { useMdComponents } from '~hooks/useMdComponents'

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

  const mdComponents = useMdComponents({ styles })

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
              variant="subtle"
              colorScheme="whiteAlpha"
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
