import { FormFieldWithId, SectionFieldBase } from '~shared/types/field'

import { BaseSectionField } from '~templates/Field/Section/SectionField'

export interface SectionFieldRowProps {
  field: FormFieldWithId<SectionFieldBase>
}

export const SectionFieldRow = ({
  field,
}: SectionFieldRowProps): JSX.Element => {
  return <BaseSectionField schema={field} />
}
