import { Box, BoxProps } from '@chakra-ui/react'

import { MarkdownText } from '~components/MarkdownText2'

interface SectionBodyTextProps extends BoxProps {
  children: string
}

export const SectionBodyText = ({
  children,
  ...props
}: SectionBodyTextProps) => {
  return (
    <Box {...props}>
      <MarkdownText
        componentProps={{
          styles: {
            text: {
              textStyle: 'body-1',
              color: props.color ?? 'brand.secondary.500',
            },
          },
        }}
      >
        {children}
      </MarkdownText>
    </Box>
  )
}
