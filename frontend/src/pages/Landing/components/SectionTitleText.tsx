import { Text, TextProps } from '@chakra-ui/react'

export const SectionTitleText = (props: TextProps) => {
  return <Text as="h2" textStyle="display-2" color="secondary.700" {...props} />
}
