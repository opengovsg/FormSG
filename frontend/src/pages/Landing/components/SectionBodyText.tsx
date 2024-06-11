import { Box, BoxProps } from '@chakra-ui/react'

import { useMdComponents } from '~hooks/useMdComponents'
import { MarkdownText } from '~components/MarkdownText'

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
        color: props.color ?? 'secondary.500',
      },
    },
  })

  return (
    <Box {...props}>
      <MarkdownText components={mdComponents}>{children}</MarkdownText>
    </Box>
  )
}
