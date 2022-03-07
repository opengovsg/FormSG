import { Text } from '@chakra-ui/react'

export interface BlockLabelTextProps {
  children: string
  htmlFor?: string
}

export const BlockLabelText = ({
  children,
  htmlFor,
}: BlockLabelTextProps): JSX.Element => {
  return (
    <Text
      lineHeight="2.75rem"
      flexShrink={0}
      as="label"
      htmlFor={htmlFor}
      textStyle="subhead-3"
      w="4.5rem"
    >
      {children}
    </Text>
  )
}
