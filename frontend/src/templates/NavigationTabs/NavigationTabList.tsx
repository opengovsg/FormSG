import {
  Box,
  BoxProps,
  forwardRef,
  StylesProvider,
  useBreakpointValue,
  useMultiStyleConfig,
} from '@chakra-ui/react'

/** Component to be styled as a tab list, but used for routing instead of conditionally showing tab panels.  */
export const NavigationTabList = forwardRef<BoxProps, 'div'>(
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
