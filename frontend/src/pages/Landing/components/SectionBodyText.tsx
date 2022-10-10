import ReactMarkdown from 'react-markdown'
import { Box, BoxProps } from '@chakra-ui/react'

import { useMdComponents } from '~hooks/useMdComponents'

interface SectionBodyTextProps extends BoxProps {
  children: string
}

export const SectionBodyText = ({
  children,
  ...props
}: SectionBodyTextProps) => {
  const mdComponents = useMdComponents({
    styles: {
      text: {
        textStyle: 'body-1',
        color: 'secondary.500',
      },
    },
  })

  return (
    <Box mt="1rem" {...props}>
      <ReactMarkdown components={mdComponents}>{children}</ReactMarkdown>
    </Box>
  )
}
