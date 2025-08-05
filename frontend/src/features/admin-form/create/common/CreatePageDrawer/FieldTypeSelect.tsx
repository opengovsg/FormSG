import { FormControl, FormLabel } from '@chakra-ui/react'

import { BasicField } from '~shared/types'

import { SingleSelect } from '~components/Dropdown/SingleSelect'

import {
  changeFieldTypeSelector,
  fieldTypeSelector,
  useFieldBuilderStore,
} from '../../builder-and-design/useFieldBuilderStore'
import { BASICFIELD_TO_DRAWER_META } from '../../constants'

export const FieldTypeSelect = (): JSX.Element => {
  const changeFieldType = useFieldBuilderStore(changeFieldTypeSelector)
  const fieldType = useFieldBuilderStore(fieldTypeSelector)

  const fieldOptions = Object.entries(BASICFIELD_TO_DRAWER_META)
    .filter(([, meta]) => meta.isUsed !== false)
    .map(([fieldType, meta]) => ({
      value: fieldType,
      label: meta.label,
      icon: meta.icon,
    }))

  const isFieldTypeChangeable =
    fieldType !== undefined &&
    fieldOptions.map((f) => f.value).includes(fieldType)

  return isFieldTypeChangeable ? (
    <FormControl>
      <FormLabel>Field Type</FormLabel>
      <SingleSelect
        items={fieldOptions}
        onChange={(value) => {
          changeFieldType(value as BasicField)
        }}
        value={fieldType as BasicField}
        name="fieldType"
        isClearable={false}
      />
    </FormControl>
  ) : (
    <></>
  )
}
