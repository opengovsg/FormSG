import { BiCheckCircle, BiGridVertical, BiSpreadsheet } from 'react-icons/bi'
import { Box, Flex, Icon, Stack, Text } from '@chakra-ui/react'
import { useDraggable } from '@dnd-kit/core'

import type { StepType } from '../../types'

type StepTypeCardProps = {
  stepType: StepType
  onClick: () => void
}

const STEP_TYPE_CONFIG: Record<
  StepType,
  { title: string; description: string; icon: typeof BiSpreadsheet }
> = {
  collect: {
    title: 'Fill up a response',
    description: 'Someone fills in form fields only',
    icon: BiSpreadsheet,
  },
  review: {
    title: 'Fill up a response and approve',
    description:
      'Someone reviews what was submitted and approves or rejects it',
    icon: BiCheckCircle,
  },
}

export const StepTypeCard = ({
  stepType,
  onClick,
}: StepTypeCardProps): JSX.Element => {
  const config = STEP_TYPE_CONFIG[stepType]

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `step-type-${stepType}`,
    data: { type: 'step_type', stepType },
  })

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      as="button"
      type="button"
      w="100%"
      textAlign="start"
      borderRadius="8px"
      border="1px solid"
      borderColor="neutral.300"
      bg="white"
      p="1rem"
      cursor="grab"
      _hover={{ borderColor: 'primary.500', bg: 'primary.100' }}
      _active={{ cursor: 'grabbing' }}
      transition="border-color 0.2s, background 0.2s, opacity 0.2s"
      opacity={isDragging ? 0.4 : 1}
      onClick={onClick}
    >
      <Flex align="center" gap="0.75rem">
        <Icon
          as={config.icon}
          fontSize="1.5rem"
          color="secondary.500"
          flexShrink={0}
        />
        <Stack spacing="0.125rem" flex={1}>
          <Text textStyle="subhead-1" color="secondary.500">
            {config.title}
          </Text>
          <Text textStyle="body-2" color="secondary.400">
            {config.description}
          </Text>
        </Stack>
        <Icon
          as={BiGridVertical}
          fontSize="1.25rem"
          color="neutral.500"
          flexShrink={0}
        />
      </Flex>
    </Box>
  )
}

/**
 * Lightweight clone used inside DragOverlay.
 */
export const StepTypeCardOverlay = ({
  stepType,
}: {
  stepType: StepType
}): JSX.Element => {
  const config = STEP_TYPE_CONFIG[stepType]

  return (
    <Box
      w="300px"
      borderRadius="8px"
      border="1px solid"
      borderColor="primary.500"
      bg="white"
      p="1rem"
      boxShadow="lg"
      cursor="grabbing"
    >
      <Flex align="center" gap="0.75rem">
        <Icon
          as={config.icon}
          fontSize="1.5rem"
          color="secondary.500"
          flexShrink={0}
        />
        <Stack spacing="0.125rem" flex={1}>
          <Text textStyle="subhead-1" color="secondary.500">
            {config.title}
          </Text>
          <Text textStyle="body-2" color="secondary.400">
            {config.description}
          </Text>
        </Stack>
        <Icon
          as={BiGridVertical}
          fontSize="1.25rem"
          color="neutral.500"
          flexShrink={0}
        />
      </Flex>
    </Box>
  )
}

export { STEP_TYPE_CONFIG }
