import {
  Box,
  BoxProps,
  forwardRef,
  StylesProvider,
  TabsProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'

interface NavigationTabListProps extends BoxProps {
  variant?: TabsProps['variant']
}

/** Component to be styled as a tab list, but used for routing instead of conditionally showing tab panels.  */
export const NavigationTabList = forwardRef<NavigationTabListProps, 'div'>(
  ({ onMouseDown, children, variant, ...props }, ref): JSX.Element => {
    const styles = useMultiStyleConfig('Tabs', { ...props, variant })

    return (
      <StylesProvider value={styles}>
        <Box
          ref={ref}
          onMouseDown={onMouseDown}
          __css={styles.tablist}
          {...props}
        >
          {children}
        </Box>
      </StylesProvider>
    )
  },
)
