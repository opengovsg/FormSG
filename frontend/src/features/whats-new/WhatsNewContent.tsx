import ReactMarkdown from 'react-markdown'
import { Box, Image, Text, UnorderedList } from '@chakra-ui/react'
import gfm from 'remark-gfm'

import { useMdComponents } from '~hooks/useMdComponents'

export interface WhatsNewContentProps {
  date: string
  title: string
  description: string
  imageUrl?: string
}

export const WhatsNewContent = ({
  date,
  title,
  description,
  imageUrl,
}: WhatsNewContentProps) => {
  const mdComponents = useMdComponents({
    styles: {
      text: {
        color: 'secondary.700',
        textStyle: 'body-1',
      },
    },
    overrides: {
      ul: ({ node, ...mdProps }) => (
        <UnorderedList {...mdProps} mb="2rem" color="secondary.700" />
      ),
    },
  })
  return (
    <Box>
      <Text textStyle="caption-1">{date}</Text>
      <Text textStyle="h4" mb="0.5rem" mt="1rem">
        {title}
      </Text>
      <ReactMarkdown components={mdComponents} remarkPlugins={[gfm]}>
        {description}
      </ReactMarkdown>
      {imageUrl && (
        <Image
          width="100%"
          mb="2rem"
          src={process.env.PUBLIC_URL + imageUrl}
          mt="2rem"
        />
      )}
    </Box>
  )
}
