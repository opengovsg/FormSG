import { Image, Stack, Text } from '@chakra-ui/react'

import { SectionBodyText } from './SectionBodyText'

interface FeatureGridItemProps {
  image?: string
  title: string
  description: string
}

export const FeatureGridItem = ({
  image,
  title,
  description,
}: FeatureGridItemProps): JSX.Element => {
  return (
    <Stack spacing="1rem">
      <Image maxW="3rem" src={image} aria-hidden />
      <Text as="h2" textStyle="h4" color="brand.secondary.700">
        {title}
      </Text>
      <SectionBodyText>{description}</SectionBodyText>
    </Stack>
  )
}
