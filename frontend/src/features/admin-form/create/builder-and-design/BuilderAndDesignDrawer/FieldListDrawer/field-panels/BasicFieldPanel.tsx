import { Box } from '@chakra-ui/react'
import { Droppable } from '@hello-pangea/dnd'

import {
  BASIC_FIELDS_CONTENT_AND_DESCRIPTIONS,
  BASIC_FIELDS_DATES_AND_NUMBER,
  BASIC_FIELDS_FREE_TEXT,
  BASIC_FIELDS_OPTIONS,
  BASIC_FIELDS_OTHERS,
  BASIC_FIELDS_PERSONAL,
  CREATE_FIELD_BASIC_FIELDS_OPTIONS_DROP_ID,
  CREATE_FIELD_CONTENT_AND_DESCRIPTIONS_DROP_ID,
  CREATE_FIELD_DATES_AND_NUMBER_DROP_ID,
  CREATE_FIELD_FREE_TEXT_DROP_ID,
  CREATE_FIELD_OTHERS_DROP_ID,
  CREATE_FIELD_PERSONAL_DROP_ID,
} from '~features/admin-form/create/builder-and-design/constants'
import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useCreateTabForm } from '../../../../builder-and-design/useCreateTabForm'
import { DraggableBasicFieldListOption } from '../FieldListOption'

import { FieldSection } from './FieldSection'
import { filterFieldsBySearchValue } from './utils'

export const BasicFieldPanel = ({ searchValue }: { searchValue: string }) => {
  const { isLoading } = useCreateTabForm()

  const filteredCreateBasicFreeTextFields = filterFieldsBySearchValue(
    searchValue,
    BASIC_FIELDS_FREE_TEXT,
    BASICFIELD_TO_DRAWER_META,
  )
  const filteredCreateBasicOptionsFields = filterFieldsBySearchValue(
    searchValue,
    BASIC_FIELDS_OPTIONS,
    BASICFIELD_TO_DRAWER_META,
  )
  const filteredCreateBasicContentAndDescriptionFields =
    filterFieldsBySearchValue(
      searchValue,
      BASIC_FIELDS_CONTENT_AND_DESCRIPTIONS,
      BASICFIELD_TO_DRAWER_META,
    )
  const filteredCreateBasicDatesAndNumberFields = filterFieldsBySearchValue(
    searchValue,
    BASIC_FIELDS_DATES_AND_NUMBER,
    BASICFIELD_TO_DRAWER_META,
  )
  const filteredCreateBasicPersonalFields = filterFieldsBySearchValue(
    searchValue,
    BASIC_FIELDS_PERSONAL,
    BASICFIELD_TO_DRAWER_META,
  )
  const filteredCreateBasicOthersFields = filterFieldsBySearchValue(
    searchValue,
    BASIC_FIELDS_OTHERS,
    BASICFIELD_TO_DRAWER_META,
  )

  return (
    <>
      <Droppable isDropDisabled droppableId={CREATE_FIELD_FREE_TEXT_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {filteredCreateBasicFreeTextFields.length > 0 && (
              <FieldSection label="Free text">
                {filteredCreateBasicFreeTextFields.map(
                  ({ fieldType, originalIndex }) => {
                    const shouldDisableField = isLoading
                    return (
                      <DraggableBasicFieldListOption
                        index={originalIndex}
                        isDisabled={shouldDisableField}
                        key={originalIndex}
                        fieldType={fieldType}
                      />
                    )
                  },
                )}
              </FieldSection>
            )}
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      <Droppable
        isDropDisabled
        droppableId={CREATE_FIELD_BASIC_FIELDS_OPTIONS_DROP_ID}
      >
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {filteredCreateBasicOptionsFields.length > 0 && (
              <FieldSection label="Options">
                {filteredCreateBasicOptionsFields.map(
                  ({ fieldType, originalIndex }) => {
                    const shouldDisableField = isLoading
                    return (
                      <DraggableBasicFieldListOption
                        index={originalIndex}
                        isDisabled={shouldDisableField}
                        key={originalIndex}
                        fieldType={fieldType}
                      />
                    )
                  },
                )}
              </FieldSection>
            )}
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      <Droppable
        isDropDisabled
        droppableId={CREATE_FIELD_CONTENT_AND_DESCRIPTIONS_DROP_ID}
      >
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {filteredCreateBasicContentAndDescriptionFields.length > 0 && (
              <FieldSection label="Content and descriptions">
                {filteredCreateBasicContentAndDescriptionFields.map(
                  ({ fieldType, originalIndex }) => {
                    const shouldDisableField = isLoading
                    return (
                      <DraggableBasicFieldListOption
                        index={originalIndex}
                        isDisabled={shouldDisableField}
                        key={originalIndex}
                        fieldType={fieldType}
                      />
                    )
                  },
                )}
              </FieldSection>
            )}
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      <Droppable
        isDropDisabled
        droppableId={CREATE_FIELD_DATES_AND_NUMBER_DROP_ID}
      >
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {filteredCreateBasicDatesAndNumberFields.length > 0 && (
              <FieldSection label="Dates and number">
                {filteredCreateBasicDatesAndNumberFields.map(
                  ({ fieldType, originalIndex }) => {
                    const shouldDisableField = isLoading
                    return (
                      <DraggableBasicFieldListOption
                        index={originalIndex}
                        isDisabled={shouldDisableField}
                        key={originalIndex}
                        fieldType={fieldType}
                      />
                    )
                  },
                )}
              </FieldSection>
            )}
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      <Droppable isDropDisabled droppableId={CREATE_FIELD_PERSONAL_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {filteredCreateBasicPersonalFields.length > 0 && (
              <FieldSection label="Personal">
                {filteredCreateBasicPersonalFields.map(
                  ({ fieldType, originalIndex }) => {
                    const shouldDisableField = isLoading
                    return (
                      <DraggableBasicFieldListOption
                        index={originalIndex}
                        isDisabled={shouldDisableField}
                        key={originalIndex}
                        fieldType={fieldType}
                      />
                    )
                  },
                )}
              </FieldSection>
            )}
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      <Droppable isDropDisabled droppableId={CREATE_FIELD_OTHERS_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {filteredCreateBasicOthersFields.length > 0 && (
              <FieldSection label="Others">
                {filteredCreateBasicOthersFields.map(
                  ({ fieldType, originalIndex }) => {
                    const shouldDisableField = isLoading
                    return (
                      <DraggableBasicFieldListOption
                        index={originalIndex}
                        isDisabled={shouldDisableField}
                        key={originalIndex}
                        fieldType={fieldType}
                      />
                    )
                  },
                )}
              </FieldSection>
            )}
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
    </>
  )
}
