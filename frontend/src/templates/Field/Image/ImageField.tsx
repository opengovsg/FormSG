/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import ReactMarkdown from 'react-markdown'
import { Box, Image, Skeleton, useBreakpointValue } from '@chakra-ui/react'
import gfm from 'remark-gfm'

import { useMdComponents } from '~hooks/useMdComponents'

import { BaseFieldProps } from '../FieldContainer'
import { ImageFieldSchema } from '../types'

export interface ImageFieldProps extends BaseFieldProps {
  schema: ImageFieldSchema
}

export const ImageField = ({ schema }: ImageFieldProps): JSX.Element => {
  const responsiveTextStyle = useBreakpointValue({
    base: 'caption-2',
    md: 'body-2',
  })

  const mdComponents = useMdComponents({
    styles: {
      text: {
        color: 'secondary.700',
        textStyle: responsiveTextStyle,
      },
    },
  })

  return (
    <Box>
      <Image
        src={schema.url}
        alt={schema.description}
        fallback={<Skeleton h="10rem" />}
      />
      {schema.description ? (
        <Box mt={{ base: '0.5rem', md: '1rem' }}>
          <ReactMarkdown components={mdComponents} remarkPlugins={[gfm]}>
            {schema.description}
          </ReactMarkdown>
        </Box>
      ) : null}
    </Box>
  )
}
