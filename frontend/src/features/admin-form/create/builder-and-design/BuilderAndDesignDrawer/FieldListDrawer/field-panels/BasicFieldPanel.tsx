import { Box } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { Droppable } from '@hello-pangea/dnd'

import { featureFlags } from '~shared/constants'
import { BasicField } from '~shared/types'

import {
  BASIC_FIELDS_ORDERED,
  CREATE_FIELD_DROP_ID,
} from '~features/admin-form/create/builder-and-design/constants'
import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { useUser } from '~features/user/queries'

import { useCreateTabForm } from '../../../../builder-and-design/useCreateTabForm'
import { DraggableBasicFieldListOption } from '../FieldListOption'

import { FieldSection } from './FieldSection'
import { filterFieldsBySearchValue } from './utils'

export const BasicFieldPanel = ({ searchValue }: { searchValue: string }) => {
  const { user } = useUser()
  const { isLoading } = useCreateTabForm()

  const isSignatureFieldEnabled = useFeatureIsOn(featureFlags.signatureField)

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
              {filteredCreateBasicFields.map(({ fieldType, originalIndex }) => {
                const shouldDisableField = isLoading

                // TODO: FRM-2054 remove when signature field is out of beta
                if (
                  fieldType === BasicField.Signature &&
                  !(user?.betaFlags?.signatureField && isSignatureFieldEnabled)
                )
                  return null

                return (
                  <DraggableBasicFieldListOption
                    index={originalIndex}
                    isDisabled={shouldDisableField}
                    key={originalIndex}
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
