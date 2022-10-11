import ReactMarkdown from 'react-markdown'
import { Box } from '@chakra-ui/react'
import gfm from 'remark-gfm'

import { useMdComponents } from '~hooks/useMdComponents'

import { BaseFieldProps } from '../FieldContainer'
import { ParagraphFieldSchema } from '../types'

export interface ParagraphFieldProps extends BaseFieldProps {
  schema: ParagraphFieldSchema
}

/**
 * Renderer for a paragraph field.
 * @note schema is still based on `StatementFieldBase`, but to the client code it is a paragraph field.
 */
export const ParagraphField = ({
  schema,
}: ParagraphFieldProps): JSX.Element => {
  const mdComponents = useMdComponents({
    styles: {
      text: {
        textStyle: 'body-1',
        color: 'secondary.700',
      },
    },
  })

  return (
    // Wrap markdown with a <div white-space='pre-wrap'> to get consecutive newlines to show up
    <Box mt="1rem" whiteSpace="pre-wrap">
      <ReactMarkdown components={mdComponents} remarkPlugins={[gfm]}>
        {schema.description}
      </ReactMarkdown>
    </Box>
  )
}
