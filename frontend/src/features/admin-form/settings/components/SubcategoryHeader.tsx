import { Text } from '@chakra-ui/react'

export interface SubcategoryHeaderProps {
  children: React.ReactNode
}

export const SubcategoryHeader = ({
  children,
}: SubcategoryHeaderProps): JSX.Element => {
  return (
    <Text
      as="h3"
      textTransform="uppercase"
      textStyle="subhead-3"
      color="primary.500"
      mb="2rem"
    >
      {children}
    </Text>
  )
}
