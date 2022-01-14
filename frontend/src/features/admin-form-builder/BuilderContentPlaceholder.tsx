import { useMemo } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { isEmpty } from 'lodash'

import { FIELD_LIST_DROPPABLE_ID } from './constants'
import { DndPlaceholderProps } from './FormBuilderPage'

export interface BuilderContentPlaceholderProps {
  placeholderProps: DndPlaceholderProps
}

export const BuilderContentPlaceholder = ({
  placeholderProps,
}: BuilderContentPlaceholderProps): JSX.Element | null => {
  const renderedContents = useMemo(() => {
    switch (placeholderProps.droppableId) {
      case FIELD_LIST_DROPPABLE_ID:
        return (
          <Box
            h="100%"
            bg="primary.200"
            opacity="0.5"
            border="dashed 1px blue"
          />
        )
      default:
        return (
          <Flex
            h="100%"
            bg="primary.200"
            border="1px solid"
            borderColor="primary.500"
            color="primary.400"
            justify="center"
            align="center"
          >
            <Text textStyle="subhead-2">Drop your field here</Text>
          </Flex>
        )
    }
  }, [placeholderProps.droppableId])

  if (isEmpty(placeholderProps)) return null

  return (
    <Box
      style={{
        top: placeholderProps.clientY,
        left: placeholderProps.clientX,
        height: placeholderProps.clientHeight,
        width: placeholderProps.clientWidth,
      }}
      py={
        placeholderProps.droppableId === FIELD_LIST_DROPPABLE_ID ? '1.25rem' : 0
      }
      pos="absolute"
    >
      {renderedContents}
    </Box>
  )
}
