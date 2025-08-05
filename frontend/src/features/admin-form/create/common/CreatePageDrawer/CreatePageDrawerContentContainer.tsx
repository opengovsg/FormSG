import { Children } from 'react'
import { Box, Divider, Stack, StackProps } from '@chakra-ui/layout'

import { FieldTypeSelect } from './FieldTypeSelect'

const InputContainer = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => <Box px="1.5rem">{children}</Box>

export interface DrawerContentContainerProps extends StackProps {
  children: React.ReactNode
  isFieldTypeChangeable?: boolean
}
/**
 * Component to provide consistent padding to rendered builder/edit field drawer
 * content. Used as some fields may have tabs that do not need this padding yet.
 */
export const CreatePageDrawerContentContainer = ({
  children,
  isFieldTypeChangeable = false,
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
      {isFieldTypeChangeable && (
        <InputContainer>
          <FieldTypeSelect />
        </InputContainer>
      )}
      {Children.map(
        children,
        (child) => child && <InputContainer>{child}</InputContainer>,
      )}
    </Stack>
  )
}
