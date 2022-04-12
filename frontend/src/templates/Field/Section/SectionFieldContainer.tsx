import { useFormSections } from '~features/public-form/components/FormFields/FormSectionsContext'

import { BaseFieldProps } from '../FieldContainer'
import { SectionFieldSchema } from '../types'

import { SectionField } from './SectionField'

export interface SectionFieldContainerProps extends BaseFieldProps {
  schema: SectionFieldSchema
}

export const SectionFieldContainer = ({
  schema,
}: SectionFieldContainerProps): JSX.Element => {
  const { sectionRefs, setActiveSectionId } = useFormSections()

  return (
    <SectionField
      ref={sectionRefs[schema._id]}
      schema={schema}
      handleSectionEnter={() => setActiveSectionId(schema._id)}
    />
  )
}
