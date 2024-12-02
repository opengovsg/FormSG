import { Box } from '@chakra-ui/react'
import { Droppable } from '@hello-pangea/dnd'

import {
  BASIC_FIELDS_ORDERED,
  CREATE_FIELD_DROP_ID,
} from '~features/admin-form/create/builder-and-design/constants'
import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useCreateTabForm } from '../../../../builder-and-design/useCreateTabForm'
import { DraggableBasicFieldListOption } from '../FieldListOption'

import { FieldSection } from './FieldSection'
import { filterFieldsBySearchValue } from './utils'

export const BasicFieldPanel = ({ searchValue }: { searchValue: string }) => {
  const { isLoading } = useCreateTabForm()

  const filteredCreateBasicFields = filterFieldsBySearchValue(
    searchValue,
    BASIC_FIELDS_ORDERED,
    BASICFIELD_TO_DRAWER_META,
  )

  return (
    <Droppable isDropDisabled droppableId={CREATE_FIELD_DROP_ID}>
      {(provided) => (
        <Box ref={provided.innerRef} {...provided.droppableProps}>
          <FieldSection>
            <FieldSection label="Basic">
              {filteredCreateBasicFields.map((fieldType, index) => {
                const shouldDisableField = isLoading
                return (
                  <DraggableBasicFieldListOption
                    index={index}
                    isDisabled={shouldDisableField}
                    key={index}
                    fieldType={fieldType}
                  />
                )
              })}
            </FieldSection>
            <Box display="none">{provided.placeholder}</Box>
          </FieldSection>
        </Box>
      )}
    </Droppable>
  )
}
