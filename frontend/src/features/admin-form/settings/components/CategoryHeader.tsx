import { Text, TextProps } from '@chakra-ui/react'

export interface CategoryHeaderProps extends TextProps {
  children: React.ReactNode
}

export const CategoryHeader = ({
  children,
  ...props
}: CategoryHeaderProps): JSX.Element => {
  return (
    <Text as="h2" textStyle="h2" color="secondary.500" mb="2.5rem" {...props}>
      {children}
    </Text>
  )
}
