import { Box, BoxProps } from '@chakra-ui/react'

import { MarkdownText } from '~components/MarkdownText'
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
