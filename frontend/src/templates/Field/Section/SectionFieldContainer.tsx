import { FormFieldWithId, SectionFieldBase } from '~shared/types/field'

import { useFormSections } from '~features/public-form/components/FormFields/FormSectionsContext'

import { BaseFieldProps } from '../FieldContainer'

import { SectionField } from './SectionField'

export type SectionFieldSchema = FormFieldWithId<SectionFieldBase>
export interface SectionFieldContainerProps extends BaseFieldProps {
  schema: SectionFieldSchema
}

export const SectionFieldContainer = ({
  schema,
  colorTheme,
}: SectionFieldContainerProps): JSX.Element => {
  const { sectionRefs, setActiveSectionId } = useFormSections()

  return (
    <SectionField
      ref={sectionRefs[schema._id]}
      schema={schema}
      colorTheme={colorTheme}
      handleSectionEnter={() => setActiveSectionId(schema._id)}
    />
  )
}
