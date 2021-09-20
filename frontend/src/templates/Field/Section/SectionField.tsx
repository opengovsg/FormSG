import { Waypoint } from 'react-waypoint'
import { Box, Divider, forwardRef, Text } from '@chakra-ui/react'

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
  ({ schema, dividerColor = 'secondary.100', handleSectionEnter }, ref) => {
    return (
      <Box>
        <SectionDivider color={dividerColor} />
        {/* id given so app can scrolled to this section */}
        <Box id={schema._id} ref={ref}>
          <Text textStyle="h2" color="primary.600">
            {schema.title}
          </Text>
          <Text textStyle="body-1" color="secondary.700" mt="1rem">
            {schema.description}
          </Text>
        </Box>
        <Waypoint
          topOffset="0"
          bottomOffset="20%"
          onEnter={handleSectionEnter}
        />
      </Box>
    )
  },
)
