import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Box, Image, Text } from '@chakra-ui/react'
import { format } from 'date-fns'
import gfm from 'remark-gfm'

import { useMdComponents } from '~hooks/useMdComponents'
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
  const mdComponents = useMdComponents({
    styles: {
      text: {
        color: 'secondary.500',
        textStyle: 'body-1',
      },
      list: {
        color: 'secondary.500',
        marginInlineStart: '1.25em',
      },
    },
  })

  const renderedImage = useMemo(() => {
    if (!image) return

    if (image.animationData) {
      return (
        <LottieAnimation
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
      <Text textStyle="caption-1" color="secondary.400">
        {formattedDate}
      </Text>
      <Text as="h4" textStyle="h4" mb="0.5rem" mt="1rem" color="secondary.700">
        {title}
      </Text>
      <ReactMarkdown components={mdComponents} remarkPlugins={[gfm]}>
        {description}
      </ReactMarkdown>
      <Box mt="2rem" role="presentation">
        {renderedImage}
      </Box>
    </Box>
  )
}
