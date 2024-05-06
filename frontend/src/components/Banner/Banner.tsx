import { useMemo } from 'react'
import {
  As,
  Box,
  BoxProps,
  CloseButton,
  Collapse,
  Flex,
  Icon,
  ThemingProps,
  useDisclosure,
  useMultiStyleConfig,
  useTheme,
} from '@chakra-ui/react'
import {
  BxsErrorCircle,
  BxsInfoCircle,
  BxX,
} from '@opengovsg/design-system-react'

export interface BannerProps extends BoxProps {
  variant?: ThemingProps<'Banner'>['variant']
  /**
   * Whether to allow collapsing of the banner.
   * Defaults to `true` if `info` variant is used, `false` otherwise.
   */
  isDismissable?: boolean
  /**
   * The icon to use for the banner. Defaults to the variant's icon.
   */
  icon?: As
  /**
   * The close button to use for the banner.
   * Defaults to the variant's close button.
   * If `null`, the close button will not be rendered.
   */
  closeButton?: React.ReactNode
  size?: ThemingProps<'Banner'>['size']
}

export const Banner = ({
  variant: _variant,
  size,
  children,
  isDismissable: isDismissableProp,
  icon: iconProp,
  closeButton,
  ...boxProps
}: BannerProps): JSX.Element => {
  const { isOpen, onToggle } = useDisclosure({
    defaultIsOpen: true,
  })

  const theme = useTheme()
  const styles = useMultiStyleConfig('Banner', { variant: _variant, size })

  // Required in case variant is set in theme, we should respect the one set in theme.
  const variant = useMemo(
    () => _variant ?? theme?.components?.Banner?.defaultProps?.size ?? 'info',
    [_variant, theme?.components?.Banner?.defaultProps?.size],
  )

  const iconToUse = useMemo(() => {
    if (iconProp) {
      return iconProp
    }
    return variant === 'info' ? BxsInfoCircle : BxsErrorCircle
  }, [iconProp, variant])

  const isDismissable = useMemo(() => {
    if (isDismissableProp !== undefined) {
      return isDismissableProp
    }
    return variant === 'info'
  }, [isDismissableProp, variant])

  const closeButtonRendered = useMemo(() => {
    if (!isDismissable) return null
    if (closeButton !== undefined) return closeButton
    return (
      <CloseButton children={<BxX />} onClick={onToggle} sx={styles.close} />
    )
  }, [closeButton, isDismissable, onToggle, styles.close])

  return (
    <Collapse in={isOpen} animateOpacity>
      <Box __css={styles.banner} {...boxProps}>
        <Flex sx={styles.item}>
          <Flex>
            <Icon as={iconToUse} __css={styles.icon} />
            {children}
          </Flex>
          {closeButtonRendered}
        </Flex>
      </Box>
    </Collapse>
  )
}
