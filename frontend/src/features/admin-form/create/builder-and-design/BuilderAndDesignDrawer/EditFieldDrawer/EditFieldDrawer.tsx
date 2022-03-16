import { memo, useCallback, useMemo } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import { Box, Flex } from '@chakra-ui/react'

import { BasicField, FieldCreateDto } from '~shared/types/field'

import IconButton from '~components/IconButton'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useBuilderFields } from '../../BuilderAndDesignContent/useBuilderFields'
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

import { FieldMutateOptions } from './edit-fieldtype/common/types'
import {
  EditCheckbox,
  EditHeader,
  EditNric,
  EditUen,
  EditYesNo,
} from './edit-fieldtype'

export const EditFieldDrawer = (): JSX.Element | null => {
  const { stateData, setToInactive, updateEditState, updateCreateState } =
    useBuilderAndDesignStore(
      useCallback(
        (state) => ({
          stateData: stateDataSelector(state),
          setToInactive: setToInactiveSelector(state),
          updateEditState: updateEditStateSelector(state),
          updateCreateState: updateCreateStateSelector(state),
        }),
        [],
      ),
    )

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
    return BASICFIELD_TO_DRAWER_META[fieldToEdit?.fieldType].label
  }, [fieldToEdit?.fieldType])

  const handleSave = useCallback(
    (field: FieldCreateDto, options?: FieldMutateOptions) => {
      if (stateData.state === BuildFieldState.CreatingField) {
        createFieldMutation.mutate(field, options)
      } else if (stateData.state === BuildFieldState.EditingField) {
        editFieldMutation.mutate(
          { ...field, _id: stateData.field._id },
          options,
        )
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

  // Hacky method of determining when to rerender the drawer,
  // i.e. when the user clicks into a different field.
  // We pass `${fieldIndex}-${numFields}` as the key. If the
  // user was creating a new field but clicked into an existing
  // field, causing the new field to be discarded, then numFields
  // changes. If the user was editing an existing field then clicked
  // into another existing field, causing the edits to be discarded,
  // then fieldIndex changes.
  const { builderFields } = useBuilderFields()
  const fieldIndex = useMemo(() => {
    if (stateData.state === BuildFieldState.CreatingField) {
      return stateData.insertionIndex
    } else if (stateData.state === BuildFieldState.EditingField) {
      return builderFields?.findIndex(
        (field) => field._id === stateData.field._id,
      )
    }
  }, [builderFields, stateData])
  const numFields = useMemo(() => builderFields?.length, [builderFields])

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
        isPendingField={stateData.state === BuildFieldState.CreatingField}
        handleChange={handleChange}
        handleSave={handleSave}
        handleCancel={setToInactive}
        key={`${fieldIndex}-${numFields}`}
      />
    </>
  )
}

interface MemoFieldDrawerContentProps {
  field: FieldCreateDto
  isLoading: boolean
  isPendingField: boolean
  handleChange: (field: FieldCreateDto) => void
  handleSave: (field: FieldCreateDto, options?: FieldMutateOptions) => void
  handleCancel: () => void
}

const MemoFieldDrawerContent = memo((props: MemoFieldDrawerContentProps) => {
  // Extract field variable just to get field.fieldType types to cooperate
  const field = useMemo(() => props.field, [props.field])
  switch (field.fieldType) {
    case BasicField.Checkbox:
      return <EditCheckbox {...props} field={field} />
    case BasicField.Nric:
      return <EditNric {...props} field={field} />
    case BasicField.Section:
      return <EditHeader {...props} field={field} />
    case BasicField.Uen:
      return <EditUen {...props} field={field} />
    case BasicField.YesNo:
      return <EditYesNo {...props} field={field} />
    default:
      return <div>TODO: Insert field options here</div>
  }
})
