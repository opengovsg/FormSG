import { BiPlus } from 'react-icons/bi'
import { Center, Icon, Text } from '@chakra-ui/react'
import { useDroppable } from '@dnd-kit/core'

type FieldDropZoneProps = {
  droppableId: string
  droppableData: Record<string, unknown>
  /** Variant changes the placeholder text */
  variant?: 'pool' | 'step_focus'
  /** Override text for approval zone */
  text?: string
}

export const FieldDropZone = ({
  droppableId,
  droppableData,
  variant = 'pool',
  text,
}: FieldDropZoneProps): JSX.Element => {
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: droppableData,
  })

  const displayText =
    text ??
    (variant === 'step_focus'
      ? 'Click here or drag a field from the left panel'
      : 'Drag a field from the left panel')

  return (
    <Center
      ref={setNodeRef}
      w="100%"
      py="1rem"
      px="1rem"
      borderRadius="4px"
      border="2px dashed"
      borderColor={isOver ? 'primary.500' : 'primary.400'}
      bg={isOver ? 'primary.200' : 'primary.100'}
      transition="background 0.15s, border-color 0.15s"
      gap="0.5rem"
    >
      <Icon as={BiPlus} fontSize="1rem" color="primary.500" />
      <Text textStyle="subhead-2" color="primary.500" textAlign="center">
        {displayText}
      </Text>
    </Center>
  )
}
