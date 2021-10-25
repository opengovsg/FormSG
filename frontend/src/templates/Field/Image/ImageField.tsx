/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import ReactMarkdown from 'react-markdown'
import { Box, Image, Skeleton } from '@chakra-ui/react'
import gfm from 'remark-gfm'

import { FormFieldWithId, ImageFieldBase } from '~shared/types/field'

import { useMdComponents } from '~hooks/useMdComponents'

export type ImageFieldSchema = FormFieldWithId<ImageFieldBase>
export interface ImageFieldProps {
  schema: ImageFieldSchema
}

export const ImageField = ({ schema }: ImageFieldProps): JSX.Element => {
  const mdComponents = useMdComponents({
    styles: {
      text: {
        color: 'secondary.700',
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
        <Box mt="1rem">
          <ReactMarkdown components={mdComponents} remarkPlugins={[gfm]}>
            {schema.description}
          </ReactMarkdown>
        </Box>
      ) : null}
    </Box>
  )
}
