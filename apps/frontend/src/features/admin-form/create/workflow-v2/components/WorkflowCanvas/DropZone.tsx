import { BiPlus } from 'react-icons/bi'
import { Box, Center, HStack, Icon, Text } from '@chakra-ui/react'
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
        bg={isOver ? 'primary.100' : 'transparent'}
        transition="background 0.15s, border-color 0.15s"
      >
        {isDragging ? (
          <HStack spacing="0.5rem">
            <Icon as={BiPlus} color="primary.500" />
            <Text
              textStyle="body-2"
              color="primary.500"
              textAlign="center"
              fontWeight={isOver ? '600' : '400'}
            >
              {isOver
                ? 'Drop here to add step'
                : 'Drag a step from the left panel into this box'}
            </Text>
          </HStack>
        ) : (
          <Text textStyle="body-2" color="primary.500" textAlign="center">
            Click on a step in the left panel or drag it into this box
          </Text>
        )}
      </Center>
    </Box>
  )
}
