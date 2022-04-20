import { Waypoint } from 'react-waypoint'
import { Box, forwardRef, Text } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { SectionFieldContainerProps } from './SectionFieldContainer'

export interface SectionFieldProps extends SectionFieldContainerProps {
  /**
   * Callback to be invoked when section boundary enters viewport.
   * Can be used to set the current active section.
   */
  handleSectionEnter?: () => void
}

// Used by SectionFieldContainer
export const SectionField = forwardRef<SectionFieldProps, 'div'>(
  ({ schema, colorTheme = FormColorTheme.Blue, handleSectionEnter }, ref) => {
    return (
      <Box
        _notFirst={{
          mt: '3.75rem',
        }}
      >
        {/* id given so app can scrolled to this section */}
        <Box id={schema._id} ref={ref}>
          <Text textStyle="h2" color={`theme-${colorTheme}.500`}>
            {schema.title}
          </Text>
          <Text textStyle="body-1" color="secondary.700" mt="1rem">
            {schema.description}
          </Text>
        </Box>
        <Waypoint
          topOffset="80px"
          bottomOffset="70%"
          onEnter={handleSectionEnter}
        />
      </Box>
    )
  },
)

export const BaseSectionField = forwardRef<
  Pick<SectionFieldProps, 'schema'>,
  'div'
>(({ schema }, ref) => {
  return (
    // id given so app can scrolled to this section.
    <Box id={schema._id} ref={ref}>
      <Text textStyle="h2" color="primary.600">
        {schema.title}
      </Text>
      <Text
        textStyle="body-1"
        color="secondary.700"
        mt="1rem"
        whiteSpace="break-spaces"
      >
        {schema.description}
      </Text>
    </Box>
  )
})
