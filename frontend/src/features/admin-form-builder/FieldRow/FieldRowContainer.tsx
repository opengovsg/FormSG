import { memo, useCallback, useMemo } from 'react'
import { BiDuplicate, BiGridHorizontal, BiTrash } from 'react-icons/bi'
import { Box, ButtonGroup, Collapse, Flex, Icon } from '@chakra-ui/react'

import { BasicField, FormFieldDto } from '~shared/types/field'

import IconButton from '~components/IconButton'

import {
  activeFieldSelector,
  updateFieldSelector,
  useEditFieldStore,
} from '../editFieldStore'

import { SectionFieldRow } from './SectionFieldRow'

export interface FieldRowContainerProps {
  field: FormFieldDto
}

export const FieldRowContainer = ({
  field,
}: FieldRowContainerProps): JSX.Element => {
  const updateActiveField = useEditFieldStore(updateFieldSelector)
  const activeField = useEditFieldStore(activeFieldSelector)

  const isActive = useMemo(
    () => activeField?._id === field._id,
    [activeField, field],
  )

  const handleFieldClick = useCallback(() => {
    if (!isActive) {
      updateActiveField(field)
    }
  }, [field, isActive, updateActiveField])

  const handleKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleFieldClick()
      }
    },
    [handleFieldClick],
  )

  return (
    <Flex
      // Focusable
      tabIndex={0}
      role="button"
      transitionDuration="normal"
      bg="white"
      _hover={{ bg: 'secondary.100' }}
      borderRadius="4px"
      {...(isActive ? { 'data-active': true } : {})}
      _focusWithin={{
        boxShadow: '0 0 0 2px var(--chakra-colors-primary-500) !important',
      }}
      _active={{
        bg: 'secondary.100',
        boxShadow: '0 0 0 2px var(--chakra-colors-primary-500)',
      }}
      flexDir="column"
      align="center"
      onClick={handleFieldClick}
      onKeyDown={handleKeydown}
    >
      <Icon
        as={BiGridHorizontal}
        color="secondary.200"
        fontSize="1.5rem"
        cursor="grab"
        transition="color 0.2s ease"
        _hover={{
          color: 'secondary.300',
        }}
      />
      <Box p="1.5rem" pt={0} w="100%">
        <MemoFieldRow field={isActive && activeField ? activeField : field} />
      </Box>
      <Collapse in={isActive} style={{ width: '100%' }}>
        <Flex
          px="1.5rem"
          flex={1}
          borderTop="1px solid var(--chakra-colors-neutral-300)"
          justify="end"
        >
          <ButtonGroup variant="clear" colorScheme="secondary" spacing={0}>
            <IconButton
              aria-label="Duplicate field"
              icon={<BiDuplicate fontSize="1.25rem" />}
            />
            <IconButton
              colorScheme="danger"
              aria-label="Delete field"
              icon={<BiTrash fontSize="1.25rem" />}
            />
          </ButtonGroup>
        </Flex>
      </Collapse>
    </Flex>
  )
}

const MemoFieldRow = memo(({ field }: { field: FormFieldDto }) => {
  switch (field.fieldType) {
    case BasicField.Section:
      return <SectionFieldRow field={field} />
    default:
      return <div>TODO: Add field row for {field.fieldType}</div>
  }
})
