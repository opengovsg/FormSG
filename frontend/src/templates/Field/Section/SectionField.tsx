import { useMemo } from 'react'
import { Waypoint } from 'react-waypoint'
import { Box, Divider, forwardRef, Text } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types/form'

import { SectionFieldContainerProps } from './SectionFieldContainer'

export interface SectionFieldProps extends SectionFieldContainerProps {
  /**
   * Callback to be invoked when section boundary enters viewport.
   * Can be used to set the current active section.
   */
  handleSectionEnter?: () => void
}

const SectionDivider = ({ color }: { color?: string }) => (
  <Divider
    borderBottomWidth="1.5rem"
    borderColor={color}
    mx="-2.5rem"
    my="2.5rem"
    w="initial"
    opacity={1}
  />
)

// Exported for testing.
export const SectionField = forwardRef<SectionFieldProps, 'div'>(
  ({ schema, colorTheme, handleSectionEnter }, ref) => {
    const dividerColor = useMemo(() => {
      switch (colorTheme) {
        case FormColorTheme.Blue:
          return 'secondary.100'
        default:
          return `theme-${colorTheme}.100`
      }
    }, [colorTheme])

    return (
      <Box>
        <SectionDivider color={dividerColor} />
        <BaseSectionField schema={schema} ref={ref} />
        <Waypoint
          topOffset="0"
          bottomOffset="20%"
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
      <Text textStyle="body-1" color="secondary.700" mt="1rem" whiteSpace="pre">
        {schema.description}
      </Text>
    </Box>
  )
})
