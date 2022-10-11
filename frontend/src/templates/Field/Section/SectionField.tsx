import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Box, forwardRef, Text } from '@chakra-ui/react'
import gfm from 'remark-gfm'

import { FormColorTheme } from '~shared/types'

import { useMdComponents } from '~hooks/useMdComponents'

import { SectionFieldContainerProps } from './SectionFieldContainer'

export type SectionFieldProps = SectionFieldContainerProps

export const useSectionColor = (colorTheme?: FormColorTheme) =>
  useMemo(() => {
    switch (colorTheme) {
      case FormColorTheme.Orange:
      case FormColorTheme.Red:
        return `theme-${colorTheme}.600` as const
      default:
        return `theme-${colorTheme}.500` as const
    }
  }, [colorTheme])

// Used by SectionFieldContainer
export const SectionField = forwardRef<SectionFieldContainerProps, 'div'>(
  (props, ref) => {
    return (
      <Box
        _notFirst={{
          mt: '3.75rem',
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
  const mdComponents = useMdComponents({
    styles: {
      text: {
        textStyle: 'body-1',
        color: 'secondary.700',
      },
    },
  })

  return (
    // id given so app can scrolled to this section.
    <Box
      id={schema._id}
      role="heading"
      ref={ref}
      _focus={{
        boxShadow: `0 0 0 2px var(--chakra-colors-theme-${colorTheme}-500)`,
      }}
      {...rest}
    >
      <Text textStyle="h2" color={sectionColor}>
        {schema.title}
      </Text>
      {schema.description && (
        // Wrap markdown with a <div white-space='pre-wrap'> to get consecutive newlines to show up
        <Box mt="1rem" whiteSpace="pre-wrap">
          <ReactMarkdown components={mdComponents} remarkPlugins={[gfm]}>
            {schema.description}
          </ReactMarkdown>
        </Box>
      )}
    </Box>
  )
})
