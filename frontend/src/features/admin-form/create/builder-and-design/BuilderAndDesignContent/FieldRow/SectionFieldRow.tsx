import { FormColorTheme } from '~shared/types'
import { FormFieldWithId, SectionFieldBase } from '~shared/types/field'

import { BaseSectionField } from '~templates/Field/Section/SectionField'

export interface SectionFieldRowProps {
  field: FormFieldWithId<SectionFieldBase>
  colorTheme?: FormColorTheme
}

export const SectionFieldRow = ({
  field,
  colorTheme,
}: SectionFieldRowProps): JSX.Element => {
  return <BaseSectionField schema={field} colorTheme={colorTheme} />
}
