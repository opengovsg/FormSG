import { useMemo } from 'react'
import { Box, Image, Text } from '@chakra-ui/react'
import { format } from 'date-fns'

import { MarkdownText } from '~components/MarkdownText'
import { LottieAnimation } from '~templates/LottieAnimation'

import { FeatureUpdateImage } from './FeatureUpdateList'

export interface WhatsNewContentProps {
  date: Date
  title: string
  description: string
  image?: FeatureUpdateImage
}

const DATE_FORMAT = 'dd MMMM YYY'

export const WhatsNewContent = ({
  date,
  title,
  description,
  image,
}: WhatsNewContentProps) => {
  const renderedImage = useMemo(() => {
    if (!image) return

    if (image.animationData) {
      return (
        <LottieAnimation
          bg="brand.primary.50"
          title={image.alt}
          aria-label={image.alt}
          animationData={image.animationData}
        />
      )
    }
    return (
      <Image width="100%" src={image.url} title={image.alt} alt={image.alt} />
    )
  }, [image])

  const formattedDate = format(date, DATE_FORMAT)
  return (
    <Box>
      <Text textStyle="caption-1" color="brand.secondary.400">
        {formattedDate}
      </Text>
      <Text
        as="h4"
        textStyle="h4"
        mb="0.5rem"
        mt="1rem"
        color="brand.secondary.700"
      >
        {title}
      </Text>
      <MarkdownText
        componentProps={{
          styles: {
            text: {
              color: 'brand.secondary.500',
              textStyle: 'body-1',
              whiteSpace: 'pre-wrap',
            },
            list: {
              color: 'brand.secondary.500',
              marginInlineStart: '1.25em',
            },
          },
        }}
      >
        {description}
      </MarkdownText>
      <Box mt="2rem" role="presentation">
        {renderedImage}
      </Box>
    </Box>
  )
}
