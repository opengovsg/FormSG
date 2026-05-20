import { Center, Text } from '@chakra-ui/react'
import { useDroppable } from '@dnd-kit/core'

type RespondentDropZoneProps = {
  /** Droppable ID - e.g. step ID or 'notification' */
  droppableId: string
  /** Data passed to the drop handler */
  droppableData: Record<string, unknown>
  /** Pool view vs step-focus view text */
  variant?: 'pool' | 'step_focus'
}

/**
 * Dashed drop zone inside step cards during respondent phase.
 * Owns its own useDroppable so it registers as a distinct drop target.
 */
export const RespondentDropZone = ({
  droppableId,
  droppableData,
  variant = 'pool',
}: RespondentDropZoneProps): JSX.Element => {
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: droppableData,
  })
  const text =
    variant === 'step_focus'
      ? 'Click on a recipient in the left panel or drag it here'
      : 'Drag a respondent from the left panel into this box'

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
    >
      <Text textStyle="subhead-2" color="primary.500" textAlign="center">
        {text}
      </Text>
    </Center>
  )
}
