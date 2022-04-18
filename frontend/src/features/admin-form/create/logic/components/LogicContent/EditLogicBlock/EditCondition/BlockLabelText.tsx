import { Text } from '@chakra-ui/react'

export interface BlockLabelTextProps {
  children: string
  htmlFor?: string
  id?: string
}

export const BlockLabelText = ({
  children,
  id,
  htmlFor,
}: BlockLabelTextProps): JSX.Element => {
  return (
    <Text
      id={id}
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
