import { Text, TextProps } from '@chakra-ui/react'

export interface CategoryHeaderProps extends TextProps {
  children: React.ReactNode
}

export const CategoryHeader = ({
  children,
  ...textProps
}: CategoryHeaderProps): JSX.Element => {
  return (
    <Text
      as="h2"
      textStyle="h4"
      color="brand.secondary.500"
      mb="2.5rem"
      {...textProps}
    >
      {children}
    </Text>
  )
}
