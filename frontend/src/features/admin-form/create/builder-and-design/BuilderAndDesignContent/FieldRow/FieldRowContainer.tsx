import { memo, useCallback, useMemo } from 'react'
import { Draggable } from 'react-beautiful-dnd'
import { FormProvider, useForm } from 'react-hook-form'
import {
  BiCog,
  BiDuplicate,
  BiEdit,
  BiGridHorizontal,
  BiTrash,
} from 'react-icons/bi'
import { useIsMutating } from 'react-query'
import {
  Box,
  ButtonGroup,
  chakra,
  Collapse,
  Fade,
  Flex,
  Icon,
} from '@chakra-ui/react'

import { BasicField, FormFieldDto } from '~shared/types/field'

import { useIsMobile } from '~hooks/useIsMobile'
import IconButton from '~components/IconButton'
import { CheckboxField, NricField, YesNoField } from '~templates/Field'

import { adminFormKeys } from '~features/admin-form/common/queries'
import { useCreatePageSidebar } from '~features/admin-form/create/common/CreatePageSidebarContext'

import { PENDING_CREATE_FIELD_ID } from '../../constants'
import { useDeleteFormField } from '../../mutations/useDeleteFormField'
import { useDuplicateFormField } from '../../mutations/useDuplicateFormField'
import {
  BuildFieldState,
  setToInactiveSelector,
  stateDataSelector,
  updateEditStateSelector,
  useBuilderAndDesignStore,
} from '../../useBuilderAndDesignStore'

import { SectionFieldRow } from './SectionFieldRow'

export interface FieldRowContainerProps {
  field: FormFieldDto
  index: number
  isDraggingOver: boolean
}

export const FieldRowContainer = ({
  field,
  index,
  isDraggingOver,
}: FieldRowContainerProps): JSX.Element => {
  const isMobile = useIsMobile()
  const numFormFieldMutations = useIsMutating(adminFormKeys.base)
  const { stateData, setToInactive, updateEditState } =
    useBuilderAndDesignStore(
      useCallback(
        (state) => ({
          stateData: stateDataSelector(state),
          setToInactive: setToInactiveSelector(state),
          updateEditState: updateEditStateSelector(state),
        }),
        [],
      ),
    )
  const { handleBuilderClick } = useCreatePageSidebar()

  const { duplicateFieldMutation } = useDuplicateFormField()
  const { deleteFieldMutation } = useDeleteFormField()

  const formMethods = useForm({ mode: 'onChange' })

  const isActive = useMemo(() => {
    if (stateData.state === BuildFieldState.EditingField) {
      return field._id === stateData.field._id
    } else if (stateData.state === BuildFieldState.CreatingField) {
      return field._id === PENDING_CREATE_FIELD_ID
    }
    return false
  }, [stateData, field])

  const handleFieldClick = useCallback(() => {
    if (!isActive) {
      updateEditState(field)
      handleBuilderClick()
    }
  }, [isActive, updateEditState, field, handleBuilderClick])

  const handleKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleFieldClick()
      }
    },
    [handleFieldClick],
  )

  const handleDuplicateClick = useCallback(() => {
    // Duplicate button should be hidden if field
    // is not yet created, but guard here just in case
    if (stateData.state !== BuildFieldState.CreatingField) {
      duplicateFieldMutation.mutate(field._id)
    }
  }, [stateData.state, duplicateFieldMutation, field._id])

  const handleDeleteClick = useCallback(() => {
    if (stateData.state === BuildFieldState.CreatingField) {
      setToInactive()
    } else if (stateData.state === BuildFieldState.EditingField) {
      deleteFieldMutation.mutate(field._id)
    }
  }, [field._id, deleteFieldMutation, setToInactive, stateData.state])

  const isAnyMutationLoading = useMemo(
    () => duplicateFieldMutation.isLoading || deleteFieldMutation.isLoading,
    [duplicateFieldMutation, deleteFieldMutation],
  )

  return (
    <Draggable
      index={index}
      isDragDisabled={!isActive || !!numFormFieldMutations}
      disableInteractiveElementBlocking
      draggableId={field._id}
    >
      {(provided, snapshot) => (
        <Box
          _first={{ pt: 0 }}
          _last={{ pb: 0 }}
          m="0.75rem"
          py="1.25rem"
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <Flex
            // Offset for focus boxShadow
            my="2px"
            // Focusable
            tabIndex={0}
            role="button"
            cursor={isActive ? 'initial' : 'pointer'}
            bg="white"
            transition="background 0.2s ease"
            _hover={{ bg: isDraggingOver ? 'white' : 'secondary.100' }}
            borderRadius="4px"
            outline="none"
            {...(isActive ? { 'data-active': true } : {})}
            _focusWithin={{
              boxShadow: snapshot.isDragging
                ? 'md'
                : '0 0 0 2px var(--chakra-colors-primary-500) !important',
            }}
            _active={{
              bg: 'secondary.100',
              boxShadow: snapshot.isDragging
                ? 'md'
                : '0 0 0 2px var(--chakra-colors-primary-500)',
            }}
            flexDir="column"
            align="center"
            onClick={handleFieldClick}
            onKeyDown={handleKeydown}
          >
            <Fade in={isActive}>
              <chakra.button
                tabIndex={isActive ? 0 : -1}
                {...provided.dragHandleProps}
                borderRadius="4px"
                _focus={{
                  boxShadow: snapshot.isDragging
                    ? undefined
                    : '0 0 0 2px var(--chakra-colors-neutral-500)',
                }}
              >
                <Icon
                  transition="color 0.2s ease"
                  _hover={{
                    color: 'secondary.300',
                  }}
                  color={
                    snapshot.isDragging ? 'secondary.300' : 'secondary.200'
                  }
                  as={BiGridHorizontal}
                  fontSize="1.5rem"
                />
              </chakra.button>
            </Fade>
            <Box
              p={{ base: '0.75rem', md: '1.5rem' }}
              pt={0}
              w="100%"
              pointerEvents={isActive ? undefined : 'none'}
            >
              <FormProvider {...formMethods}>
                <MemoFieldRow field={field} />
              </FormProvider>
            </Box>
            <Collapse in={isActive} style={{ width: '100%' }}>
              <Flex
                px={{ base: '0.75rem', md: '1.5rem' }}
                flex={1}
                borderTop="1px solid var(--chakra-colors-neutral-300)"
                justify={{ base: 'space-between', md: 'end' }}
              >
                {isMobile ? (
                  <IconButton
                    variant="clear"
                    colorScheme="secondary"
                    aria-label="Edit field"
                    icon={<BiEdit fontSize="1.25rem" />}
                  />
                ) : null}
                <ButtonGroup
                  variant="clear"
                  colorScheme="secondary"
                  spacing={0}
                >
                  <IconButton
                    aria-label="Close field settings"
                    icon={<BiCog fontSize="1.25rem" />}
                    onClick={setToInactive}
                    isDisabled={isAnyMutationLoading}
                  />
                  {
                    // Fields which are not yet created cannot be duplicated
                    stateData.state !== BuildFieldState.CreatingField && (
                      <IconButton
                        aria-label="Duplicate field"
                        isDisabled={isAnyMutationLoading}
                        onClick={handleDuplicateClick}
                        isLoading={duplicateFieldMutation.isLoading}
                        icon={<BiDuplicate fontSize="1.25rem" />}
                      />
                    )
                  }
                  <IconButton
                    colorScheme="danger"
                    aria-label="Delete field"
                    icon={<BiTrash fontSize="1.25rem" />}
                    onClick={handleDeleteClick}
                    isLoading={deleteFieldMutation.isLoading}
                    isDisabled={isAnyMutationLoading}
                  />
                </ButtonGroup>
              </Flex>
            </Collapse>
          </Flex>
        </Box>
      )}
    </Draggable>
  )
}

const MemoFieldRow = memo(({ field }: { field: FormFieldDto }) => {
  switch (field.fieldType) {
    case BasicField.Section:
      return <SectionFieldRow field={field} />
    case BasicField.Checkbox:
      return <CheckboxField schema={field} />
    case BasicField.YesNo:
      return <YesNoField schema={field} />
    case BasicField.Nric:
      return <NricField schema={field} />
    default:
      return <div>TODO: Add field row for {field.fieldType}</div>
  }
})
