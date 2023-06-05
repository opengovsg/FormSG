import { useMemo } from 'react'
import { BiX } from 'react-icons/bi'
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
import { MarkdownText } from '~components/MarkdownText'

export interface BannerProps {
  variant?: BannerVariant
  children: string
  useMarkdown?: boolean
  showCloseButton?: boolean
}

export const Banner = ({
  variant = 'info',
  children,
  useMarkdown = false,
  showCloseButton,
}: BannerProps): JSX.Element => {
  const { isOpen, onToggle } = useDisclosure({
    defaultIsOpen: true,
  })

  const styles = useMultiStyleConfig('Banner', { variant })

  const mdComponents = useMdComponents({ styles })

  const shouldShowCloseButton = useMemo(() => {
    // Prop supercedes all.
    if (showCloseButton !== undefined) return showCloseButton
    return variant === 'info'
  }, [showCloseButton, variant])

  return (
    <Collapse style={{ overflow: 'visible' }} in={isOpen} animateOpacity>
      <Box __css={styles.banner}>
        <Flex sx={styles.item}>
          <Flex>
            <Icon
              as={variant === 'info' ? BxsInfoCircle : BxsErrorCircle}
              aria-label={`${variant} banner icon`}
              __css={styles.icon}
            />
            {useMarkdown ? (
              <MarkdownText components={mdComponents}>{children}</MarkdownText>
            ) : (
              children
            )}
          </Flex>
          {shouldShowCloseButton && (
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
