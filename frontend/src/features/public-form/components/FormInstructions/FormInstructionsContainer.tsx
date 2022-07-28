import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useFormSections } from '../FormFields/FormSectionsContext'

import { FormInstructions } from './FormInstructions'

export const FormInstructionsContainer = (): JSX.Element | null => {
  const { sectionRefs, setActiveSectionId } = useFormSections()
  const { form } = usePublicFormContext()

  return (
    <FormInstructions
      content={form?.startPage.paragraph}
      colorTheme={form?.startPage.colorTheme}
      handleSectionEnter={() => setActiveSectionId('instructions')}
      ref={sectionRefs['instructions']}
    />
  )
}
