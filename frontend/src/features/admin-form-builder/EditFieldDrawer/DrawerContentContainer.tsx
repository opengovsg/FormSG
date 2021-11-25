import { Box, BoxProps } from '@chakra-ui/layout'

export interface DrawerContentContainerProps extends BoxProps {
  children: React.ReactNode
}
/**
 * Component to provide consistent padding to rendered builder/edit field drawer
 * content. Used as some fields may have tabs that do not need this padding yet.
 */
export const DrawerContentContainer = ({
  children,
  ...props
}: DrawerContentContainerProps): JSX.Element => {
  return (
    <Box py="2rem" px="1.5rem" {...props}>
      {children}
    </Box>
  )
}
