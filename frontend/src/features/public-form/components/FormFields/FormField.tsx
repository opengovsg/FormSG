import { Text } from '@chakra-ui/react'

import { BasicField, FormFieldDto } from '~shared/types/field'
import { FormColorTheme } from '~shared/types/form'

import {
  NricField,
  NumberField,
  SectionField,
  ShortTextField,
  UenField,
  YesNoField,
} from '~templates/Field'

interface FormFieldProps {
  field: FormFieldDto
  colorTheme?: FormColorTheme
}

export const FormField = ({ field, colorTheme }: FormFieldProps) => {
  switch (field.fieldType) {
    case BasicField.Section:
      return <SectionField schema={field} colorTheme={colorTheme} />
    case BasicField.Nric:
      return <NricField schema={field} colorTheme={colorTheme} />
    case BasicField.Number:
      return <NumberField schema={field} colorTheme={colorTheme} />
    case BasicField.ShortText:
      return <ShortTextField schema={field} colorTheme={colorTheme} />
    case BasicField.YesNo:
      return <YesNoField schema={field} colorTheme={colorTheme} />
    case BasicField.Uen:
      return <UenField schema={field} colorTheme={colorTheme} />
    default:
      return <Text w="100%">{JSON.stringify(field)}</Text>
  }
}
