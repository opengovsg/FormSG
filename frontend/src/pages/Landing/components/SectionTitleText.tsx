import { Text, TextProps } from '@chakra-ui/react'

export const SectionTitleText = (props: TextProps) => {
  return (
    <Text
      as="h2"
      textStyle="responsive-heading-heavy"
      color="brand.secondary.700"
      {...props}
    />
  )
}
