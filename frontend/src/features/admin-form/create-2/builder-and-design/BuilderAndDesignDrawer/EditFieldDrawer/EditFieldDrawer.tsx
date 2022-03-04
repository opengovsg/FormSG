import { memo, useCallback, useMemo } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import { Box, Flex } from '@chakra-ui/react'

import { BasicField, FieldCreateDto, FormFieldDto } from '~shared/types/field'

import IconButton from '~components/IconButton'

import { FIELDS_TO_CREATE_META } from '../../constants'
import { useCreateFormField } from '../../mutations/useCreateFormField'
import { useEditFormField } from '../../mutations/useEditFormField'
import {
  BuildFieldState,
  setToInactiveSelector,
  stateDataSelector,
  updateCreateStateSelector,
  updateEditStateSelector,
  useBuilderAndDesignStore,
} from '../../useBuilderAndDesignStore'
import { CreatePageDrawerCloseButton } from '../CreatePageDrawerCloseButton'

import { EditHeader } from './edit-fieldtype/EditHeader'

export const EditFieldDrawer = (): JSX.Element | null => {
  const stateData = useBuilderAndDesignStore(stateDataSelector)
  const setToInactive = useBuilderAndDesignStore(setToInactiveSelector)
  const updateEditState = useBuilderAndDesignStore(updateEditStateSelector)
  const updateCreateState = useBuilderAndDesignStore(updateCreateStateSelector)

  const { editFieldMutation } = useEditFormField()
  const { createFieldMutation } = useCreateFormField()

  const fieldToEdit: FieldCreateDto | undefined = useMemo(() => {
    if (
      stateData.state === BuildFieldState.EditingField ||
      stateData.state === BuildFieldState.CreatingField
    ) {
      return stateData.field
    }
  }, [stateData])

  const basicFieldText = useMemo(() => {
    if (!fieldToEdit?.fieldType) return ''
    return FIELDS_TO_CREATE_META[fieldToEdit?.fieldType].label
  }, [fieldToEdit?.fieldType])

  const buttonText = useMemo(
    () =>
      stateData.state === BuildFieldState.CreatingField ? 'Create' : 'Save',
    [stateData.state],
  )

  const handleSave = useCallback(
    (field: FieldCreateDto) => {
      if (stateData.state === BuildFieldState.CreatingField) {
        createFieldMutation.mutate(field)
      } else if (stateData.state === BuildFieldState.EditingField) {
        editFieldMutation.mutate({ ...field, _id: stateData.field._id })
      }
    },
    [createFieldMutation, editFieldMutation, stateData],
  )

  const handleChange = useCallback(
    (field: FieldCreateDto) => {
      if (stateData.state === BuildFieldState.CreatingField) {
        updateCreateState(field, stateData.insertionIndex)
      } else if (stateData.state === BuildFieldState.EditingField) {
        updateEditState({ ...field, _id: stateData.field._id })
      }
    },
    [stateData, updateCreateState, updateEditState],
  )

  if (!fieldToEdit) return null

  return (
    <>
      <Flex
        pos="sticky"
        top={0}
        px="1.5rem"
        py="1rem"
        align="center"
        borderBottom="1px solid var(--chakra-colors-neutral-300)"
        bg="white"
      >
        <IconButton
          minH="1.5rem"
          minW="1.5rem"
          aria-label="Back to field selection"
          variant="clear"
          colorScheme="secondary"
          onClick={setToInactive}
          icon={<BiLeftArrowAlt />}
        />
        <Box m="auto">Edit {basicFieldText} field</Box>
        <CreatePageDrawerCloseButton />
      </Flex>
      <MemoFieldDrawerContent
        field={fieldToEdit}
        isLoading={createFieldMutation.isLoading || editFieldMutation.isLoading}
        buttonText={buttonText}
        handleChange={handleChange}
        handleSave={handleSave}
        handleCancel={setToInactive}
      />
    </>
  )
}

interface MemoFieldDrawerContentProps {
  field: FieldCreateDto
  isLoading: boolean
  buttonText: string
  handleChange: (field: FieldCreateDto) => void
  handleSave: (field: FieldCreateDto) => void
  handleCancel: () => void
}

const MemoFieldDrawerContent = memo((props: MemoFieldDrawerContentProps) => {
  // Extract field variable just to get field.fieldType types to cooperate
  const field = useMemo(() => props.field, [props.field])
  switch (field.fieldType) {
    case BasicField.Section:
      return <EditHeader {...props} field={field} />
    default:
      return <div>TODO: Insert field options here</div>
  }
})
