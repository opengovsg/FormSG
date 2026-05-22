import {
  BiCaretDownSquare,
  BiEnvelope,
  BiGridVertical,
  BiLinkExternal,
  BiMailSend,
  BiPencil,
  BiUser,
} from 'react-icons/bi'
import { Box, Checkbox, Flex, Icon, Stack, Text } from '@chakra-ui/react'
import { useDraggable } from '@dnd-kit/core'

import type { Respondent, RespondentType } from '../../types'
import {
  fieldsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

const RESPONDENT_TYPE_ICON: Record<RespondentType, typeof BiUser> = {
  form_link: BiUser,
  collaborator: BiUser,
  email_field: BiEnvelope,
  specific_email: BiMailSend,
  dropdown_field: BiCaretDownSquare,
}

type RespondentCardProps = {
  respondent: Respondent
  /** Show checkbox for step-focus mode */
  showCheckbox?: boolean
  /** Checkbox checked state (step-focus mode) */
  isChecked?: boolean
  /** Checkbox toggle handler */
  onToggle?: () => void
  /** Click handler for pool mode (edit) */
  onEdit?: () => void
}

export const RespondentCard = ({
  respondent,
  showCheckbox = false,
  isChecked = false,
  onToggle,
  onEdit,
}: RespondentCardProps): JSX.Element => {
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const isDraggable = respondent.type !== 'form_link'
  const TypeIcon = RESPONDENT_TYPE_ICON[respondent.type]

  // Derive description from linked field for field-dependent types
  const linkedField = respondent.linkedFieldId
    ? fields.find((f) => f.id === respondent.linkedFieldId)
    : undefined
  const displayDescription =
    respondent.type === 'email_field' && linkedField
      ? `Emails filled into the ${linkedField.number}. ${linkedField.name} field`
      : respondent.type === 'dropdown_field' && linkedField
        ? `Emails assigned to options in the ${linkedField.number}. ${linkedField.name} field`
        : respondent.description

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: respondent.id,
    data: { type: 'respondent_card', respondent },
    disabled: !isDraggable,
  })

  return (
    <Box
      ref={isDraggable ? setNodeRef : undefined}
      {...(isDraggable ? { ...listeners, ...attributes } : {})}
      role="group"
      w="100%"
      textAlign="start"
      borderRadius="12px"
      border="1px solid"
      borderColor="neutral.300"
      bg="white"
      p="1rem"
      cursor={isDraggable || showCheckbox || onEdit ? 'pointer' : undefined}
      _hover={
        isDraggable || showCheckbox || onEdit
          ? { borderColor: 'primary.500', bg: 'primary.100' }
          : undefined
      }
      _active={
        isDraggable && !showCheckbox && !onEdit
          ? { cursor: 'grabbing' }
          : undefined
      }
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
        <Box flex={1} minW={0}>
          <Text textStyle="subhead-1" color="secondary.500" noOfLines={1}>
            {respondent.name}
          </Text>
          {displayDescription && (
            <Text textStyle="body-2" color="secondary.400" noOfLines={2}>
              {displayDescription}
            </Text>
          )}
        </Box>
        {/* Action icon (hover-reveal in pool mode) + drag handle */}
        {isDraggable && (
          <Flex alignItems="center" flexShrink={0} gap="0.25rem">
            {!showCheckbox && onEdit && (
              <Box
                opacity={0}
                _groupHover={{ opacity: 1 }}
                transition="opacity 0.15s"
                display="flex"
                alignItems="center"
              >
                <Icon
                  as={
                    respondent.type === 'collaborator'
                      ? BiLinkExternal
                      : BiPencil
                  }
                  fontSize="1rem"
                  color="secondary.400"
                />
              </Box>
            )}
            <Box display="flex" alignItems="center">
              <Icon
                as={BiGridVertical}
                fontSize="1.25rem"
                color="neutral.500"
              />
            </Box>
          </Flex>
        )}
      </Flex>
    </Box>
  )
}

/**
 * Lightweight clone used inside DragOverlay during respondent drag.
 */
export const RespondentCardOverlay = ({
  respondent,
}: {
  respondent: Respondent
}): JSX.Element => {
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const TypeIcon = RESPONDENT_TYPE_ICON[respondent.type]
  const linkedField = respondent.linkedFieldId
    ? fields.find((f) => f.id === respondent.linkedFieldId)
    : undefined
  const displayDescription =
    respondent.type === 'email_field' && linkedField
      ? `Emails filled into the ${linkedField.number}. ${linkedField.name} field`
      : respondent.type === 'dropdown_field' && linkedField
        ? `Emails assigned to options in the ${linkedField.number}. ${linkedField.name} field`
        : respondent.description

  return (
    <Box
      w="30rem"
      maxW="calc(33.25rem - 3rem)"
      borderRadius="12px"
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
        <Stack spacing="0.125rem" flex={1} minW={0}>
          <Text textStyle="subhead-1" color="secondary.500" noOfLines={1}>
            {respondent.name}
          </Text>
          {displayDescription && (
            <Text textStyle="body-2" color="secondary.400" noOfLines={2}>
              {displayDescription}
            </Text>
          )}
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
