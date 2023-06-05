import { Droppable } from 'react-beautiful-dnd'
import { Box } from '@chakra-ui/react'

import {
  BASIC_FIELDS_ORDERED,
  CREATE_FIELD_DROP_ID,
} from '~features/admin-form/create/builder-and-design/constants'

import { useCreateTabForm } from '../../../../builder-and-design/useCreateTabForm'
import { DraggableBasicFieldListOption } from '../FieldListOption'

import { FieldSection } from './FieldSection'

export const BasicFieldPanel = () => {
  const { isLoading } = useCreateTabForm()

  return (
    <Droppable isDropDisabled droppableId={CREATE_FIELD_DROP_ID}>
      {(provided) => (
        <Box ref={provided.innerRef} {...provided.droppableProps}>
          <FieldSection>
            {BASIC_FIELDS_ORDERED.map((fieldType, index) => (
              <DraggableBasicFieldListOption
                index={index}
                isDisabled={isLoading}
                key={index}
                fieldType={fieldType}
              />
            ))}
            <Box display="none">{provided.placeholder}</Box>
          </FieldSection>
        </Box>
      )}
    </Droppable>
  )
}
