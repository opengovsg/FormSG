import { Droppable } from 'react-beautiful-dnd'
import { Box } from '@chakra-ui/react'

import { BasicField, FormResponseMode } from '~shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'
import {
  BASIC_FIELDS_ORDERED,
  CREATE_FIELD_DROP_ID,
} from '~features/admin-form/create/builder-and-design/constants'

import { useCreateTabForm } from '../../../../builder-and-design/useCreateTabForm'
import { DraggableBasicFieldListOption } from '../FieldListOption'

import { FieldSection } from './FieldSection'

export const BasicFieldPanel = () => {
  const { isLoading } = useCreateTabForm()
  const { data: form } = useAdminForm()

  return (
    <Droppable isDropDisabled droppableId={CREATE_FIELD_DROP_ID}>
      {(provided) => (
        <Box ref={provided.innerRef} {...provided.droppableProps}>
          <FieldSection>
            {BASIC_FIELDS_ORDERED.map((fieldType, index) => {
              let shouldDisableField = isLoading

              // Attachment is not supported on MRF
              if (
                fieldType === BasicField.Attachment &&
                form?.responseMode === FormResponseMode.Multirespondent
              ) {
                shouldDisableField = true
              }

              return (
                <DraggableBasicFieldListOption
                  index={index}
                  isDisabled={shouldDisableField}
                  key={index}
                  fieldType={fieldType}
                />
              )
            })}
            <Box display="none">{provided.placeholder}</Box>
          </FieldSection>
        </Box>
      )}
    </Droppable>
  )
}
