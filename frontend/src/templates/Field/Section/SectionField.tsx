import { Box, forwardRef } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { MarkdownText } from '~components/MarkdownText'

import { SectionFieldContainerProps } from './SectionFieldContainer'
import { useSectionColor } from './useSectionColor'

export type SectionFieldProps = SectionFieldContainerProps

// Used by SectionFieldContainer
export const SectionField = forwardRef<SectionFieldContainerProps, 'div'>(
  (props, ref) => {
    return (
      <Box
        _notFirst={{
          mt: '1.5rem',
        }}
      >
        <BaseSectionField {...props} ref={ref} />
      </Box>
    )
  },
)

export const BaseSectionField = forwardRef<
  Pick<SectionFieldProps, 'schema' | 'colorTheme'>,
  'div'
>(({ schema, colorTheme = FormColorTheme.Blue, ...rest }, ref) => {
  const sectionColor = useSectionColor(colorTheme)

  return (
    // id given so app can scrolled to this section.
    <Box
      id={schema._id}
      ref={ref}
      _focus={{
        boxShadow: `0 0 0 2px var(--chakra-colors-theme-${colorTheme}-500)`,
      }}
      {...rest}
    >
      <Box as="h2" textStyle="h4" color={sectionColor}>
        {schema.title}
      </Box>
      {schema.description && (
        <Box mt="1rem">
          <MarkdownText
            multilineBreaks
            componentProps={{
              styles: {
                text: {
                  textStyle: 'body-1',
                  color: 'brand.secondary.700',
                },
              },
            }}
          >
            {schema.description}
          </MarkdownText>
        </Box>
      )}
    </Box>
  )
})
