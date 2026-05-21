import {
  BiCalendar,
  BiCaretDownSquare,
  BiChat,
  BiEnvelope,
  BiGridVertical,
  BiLinkExternal,
  BiText,
  BiToggleRight,
} from 'react-icons/bi'
import { Box, Checkbox, Flex, Icon, Text } from '@chakra-ui/react'
import { useDraggable } from '@dnd-kit/core'

import type { FieldType, FormField } from '../../types'

const FIELD_TYPE_ICON: Record<FieldType, typeof BiText> = {
  short_text: BiText,
  email: BiEnvelope,
  dropdown: BiCaretDownSquare,
  date: BiCalendar,
  long_text: BiChat,
  yes_no: BiToggleRight,
}

type FieldCardProps = {
  field: FormField
  /** Show checkbox for step-focus mode */
  showCheckbox?: boolean
  /** Checkbox checked state */
  isChecked?: boolean
  /** Checkbox toggle handler */
  onToggle?: () => void
  /** Click handler for pool mode (edit) */
  onEdit?: () => void
}

export const FieldCard = ({
  field,
  showCheckbox = false,
  isChecked = false,
  onToggle,
  onEdit,
}: FieldCardProps): JSX.Element => {
  const TypeIcon = FIELD_TYPE_ICON[field.fieldType]

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: field.id,
    data: { type: 'field_card', field },
  })

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="group"
      w="100%"
      textAlign="start"
      borderRadius="8px"
      border="1px solid"
      borderColor="neutral.300"
      bg="white"
      p="1rem"
      cursor={showCheckbox ? 'pointer' : 'grab'}
      _hover={{ borderColor: 'primary.500', bg: 'primary.100' }}
      _active={!showCheckbox ? { cursor: 'grabbing' } : undefined}
      transition="border-color 0.2s, background 0.2s, opacity 0.2s"
      opacity={isDragging ? 0.4 : 1}
      onClick={showCheckbox ? onToggle : onEdit}
    >
      <Flex align="center" gap="0.75rem">
        {showCheckbox && (
          <Box flexShrink={0}>
            <Checkbox
              isChecked={isChecked}
              onChange={onToggle}
              colorScheme="primary"
              onClick={(e) => e.stopPropagation()}
            />
          </Box>
        )}
        <Icon
          as={TypeIcon}
          fontSize="1.5rem"
          color="secondary.500"
          flexShrink={0}
        />
        <Text
          textStyle="subhead-1"
          color="secondary.500"
          noOfLines={1}
          flex={1}
          minW={0}
        >
          {field.number}. {field.name}
        </Text>
        <Flex alignItems="center" flexShrink={0} gap="0.25rem">
          {!showCheckbox && onEdit && (
            <Box
              opacity={0}
              _groupHover={{ opacity: 1 }}
              transition="opacity 0.15s"
              display="flex"
              alignItems="center"
            >
              <Icon as={BiLinkExternal} fontSize="1rem" color="secondary.400" />
            </Box>
          )}
          <Box display="flex" alignItems="center">
            <Icon as={BiGridVertical} fontSize="1.25rem" color="neutral.500" />
          </Box>
        </Flex>
      </Flex>
    </Box>
  )
}

/**
 * Lightweight clone used inside DragOverlay during field drag.
 */
export const FieldCardOverlay = ({
  field,
}: {
  field: FormField
}): JSX.Element => {
  const TypeIcon = FIELD_TYPE_ICON[field.fieldType]

  return (
    <Box
      w="30rem"
      maxW="calc(33.25rem - 3rem)"
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
          as={TypeIcon}
          fontSize="1.5rem"
          color="secondary.500"
          flexShrink={0}
        />
        <Text
          textStyle="subhead-1"
          color="secondary.500"
          noOfLines={1}
          flex={1}
          minW={0}
        >
          {field.number}. {field.name}
        </Text>
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
