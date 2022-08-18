import { ComponentProps, useMemo } from 'react'
import { Link as ReactLink, useLocation } from 'react-router-dom'
import {
  Box,
  BoxProps,
  chakra,
  forwardRef,
  StylesProvider,
  useBreakpointValue,
  useMultiStyleConfig,
  useStyles,
} from '@chakra-ui/react'

import { ACTIVE_ADMINFORM_BUILDER_ROUTE_REGEX } from '~constants/routes'

const Link = chakra(ReactLink)

export const FauxTabs = forwardRef<BoxProps, 'div'>(
  ({ onMouseDown, children, ...props }, ref): JSX.Element => {
    const responsiveVariant = useBreakpointValue({
      base: 'line-dark',
      xs: 'line-dark',
      lg: 'line-light',
    })
    const styles = useMultiStyleConfig('Tabs', {
      variant: responsiveVariant,
      ...props,
    })

    return (
      <StylesProvider value={styles}>
        <Box
          ref={ref}
          onMouseDown={onMouseDown}
          __css={styles.tablist}
          pt={{ base: '0.625rem', lg: 0 }}
          px={{ base: '1.25rem', lg: '1rem' }}
          w={{ base: '100vw', lg: 'initial' }}
          gridArea="tabs"
          borderBottom="none"
          justifySelf={{ base: 'flex-start', lg: 'center' }}
          alignSelf="center"
        >
          {children}
        </Box>
      </StylesProvider>
    )
  },
)

export const FauxTabLink = forwardRef<ComponentProps<typeof Link>, 'a'>(
  ({ to, ...props }, ref) => {
    const styles = useStyles()
    const { pathname } = useLocation()

    const isActive = useMemo(() => {
      const match = pathname.match(ACTIVE_ADMINFORM_BUILDER_ROUTE_REGEX)
      return (match?.[2] ?? '/') === `/${to}`
    }, [pathname, to])

    return (
      <Link
        to={to}
        ref={ref}
        aria-selected={isActive}
        __css={styles.tab}
        {...props}
      />
    )
  },
)
