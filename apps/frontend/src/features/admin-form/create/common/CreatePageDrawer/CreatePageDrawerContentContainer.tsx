import { Children } from 'react'
import { Box, Divider, Stack, StackProps } from '@chakra-ui/layout'

export interface DrawerContentContainerProps extends StackProps {
  children: React.ReactNode
}
/**
 * Component to provide consistent padding to rendered builder/edit field drawer
 * content. Used as some fields may have tabs that do not need this padding yet.
 */
export const CreatePageDrawerContentContainer = ({
  children,
  ...props
}: DrawerContentContainerProps): JSX.Element => {
  return (
    <Stack
      py="2rem"
      flexDir="column"
      flex={1}
      pos="relative"
      overflow="auto"
      divider={<Divider />}
      spacing="2rem"
      {...props}
    >
      {Children.map(
        children,
        (child) => child && <Box px="1.5rem">{child}</Box>,
      )}
    </Stack>
  )
}
