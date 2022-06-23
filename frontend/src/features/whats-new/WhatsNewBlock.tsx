import { Box, Divider } from '@chakra-ui/react'

import { WhatsNewContent } from './WhatsNewContent'

export interface WhatsNewBlockProps {
  date: string
  title: string
  description: string
  imageUrl?: string
}

export const WhatsNewBlock = (WhatsNewBlockProps: WhatsNewBlockProps) => {
  return (
    <Box
      paddingTop="2rem"
      paddingLeft="2.5rem"
      paddingRight="2.5rem"
      position="relative"
      w="100%"
    >
      <WhatsNewContent {...WhatsNewBlockProps} />
      <Divider textAlign="center" w="auto" />
    </Box>
  )
}
