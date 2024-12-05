import { useEffect, useMemo, useState } from 'react'
import { Box, Image, Skeleton, useBreakpointValue } from '@chakra-ui/react'

import { Language } from '~shared/types'

import { useMdComponents } from '~hooks/useMdComponents'
import { getValueInSelectedLanguage } from '~utils/multiLanguage'
import { MarkdownText } from '~components/MarkdownText'

import { BaseFieldProps } from '../FieldContainer'
import { ImageFieldSchema } from '../types'

import { InvalidImage } from './InvalidImage'

export interface ImageFieldProps extends BaseFieldProps {
  schema: ImageFieldSchema
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const ImageField = ({
  schema,
  selectedLanguage = Language.ENGLISH,
}: ImageFieldProps): JSX.Element => {
  const [fallbackType, setFallbackType] = useState<'loading' | 'error'>(
    'loading',
  )
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

  // Reset fallback type to `loading` whenever url changes.
  useEffect(() => {
    if (schema.url) {
      setFallbackType('loading')
    }
  }, [schema.url])

  const fallback = useMemo(() => {
    if (!schema.url) {
      return <InvalidImage message="Image not provided" />
    }
    if (fallbackType === 'error') {
      return <InvalidImage message="This image could not be displayed" />
    }
    return <Skeleton height="10rem" />
  }, [fallbackType, schema.url])

  const description = getValueInSelectedLanguage({
    defaultValue: schema.description,
    translations: schema.descriptionTranslations ?? [],
    selectedLanguage,
  })

  return (
    <Box>
      <Image
        src={schema.url}
        alt={description}
        fallback={fallback}
        onError={() => setFallbackType('error')}
      />
      {description ? (
        <Box mt={{ base: '0.5rem', md: '1rem' }}>
          <MarkdownText multilineBreaks components={mdComponents}>
            {description}
          </MarkdownText>
        </Box>
      ) : null}
    </Box>
  )
}
