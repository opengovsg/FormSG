import { Text, TextProps } from '@chakra-ui/react'

export interface CategorySubHeaderProps extends TextProps {
  children: React.ReactNode
}

export const CategorySubHeader = ({
  children,
  ...textProps
}: CategorySubHeaderProps): JSX.Element => {
  return (
    <Text
      as="h3"
      textStyle="h3"
      color="secondary.500"
      mb="2.5rem"
      {...textProps}
    >
      {children}
    </Text>
  )
}
