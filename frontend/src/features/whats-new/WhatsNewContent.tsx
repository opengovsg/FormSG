import ReactMarkdown from 'react-markdown'
import { Box, Image, Text } from '@chakra-ui/react'
import gfm from 'remark-gfm'

import { useMdComponents } from '~hooks/useMdComponents'

import { FeatureUpdateImage } from './FeatureUpdateList'

export interface WhatsNewContentProps {
  date: string
  title: string
  description: string
  image?: FeatureUpdateImage
}

export const WhatsNewContent = ({
  date,
  title,
  description,
  image,
}: WhatsNewContentProps) => {
  const mdComponents = useMdComponents({
    styles: {
      text: {
        color: 'secondary.700',
        textStyle: 'body-1',
      },
      list: {
        color: 'secondary.700',
      },
    },
  })
  return (
    <Box paddingX="2.5rem" paddingY="1.25">
      <Text textStyle="caption-1">{date}</Text>
      <Text textStyle="h4" mb="0.5rem" mt="1rem">
        {title}
      </Text>
      <ReactMarkdown components={mdComponents} remarkPlugins={[gfm]}>
        {description}
      </ReactMarkdown>
      {image && (
        <Image width="100%" src={image.url} mt="2rem" alt={image.alt} />
      )}
    </Box>
  )
}
