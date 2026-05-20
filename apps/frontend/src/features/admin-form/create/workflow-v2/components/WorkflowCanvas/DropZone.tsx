import { Box, Center, Text } from '@chakra-ui/react'
import { useDroppable } from '@dnd-kit/core'

type DropZoneProps = {
  insertIndex: number
  isDragging?: boolean
}

export const DropZone = ({
  insertIndex,
  isDragging = false,
}: DropZoneProps): JSX.Element => {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-zone-${insertIndex}`,
    data: { type: 'drop_zone', insertIndex },
  })

  return (
    <Box
      ref={setNodeRef}
      w="100%"
      borderRadius="8px"
      bg="white"
      border="1px solid"
      borderColor={isOver ? 'primary.500' : 'neutral.300'}
      p="0.75rem"
      transition="border-color 0.15s"
    >
      <Center
        w="100%"
        py="1rem"
        px="1rem"
        borderRadius="4px"
        border="2px dashed"
        borderColor={isOver ? 'primary.500' : 'primary.400'}
        bg={isOver ? 'primary.200' : 'primary.100'}
        transition="background 0.15s, border-color 0.15s"
      >
        <Text textStyle="subhead-2" color="primary.500" textAlign="center">
          {isDragging
            ? isOver
              ? 'Drop here to add step'
              : 'Drag a step from the left panel into this box'
            : 'Click on a step in the left panel or drag it into this box'}
        </Text>
      </Center>
    </Box>
  )
}
