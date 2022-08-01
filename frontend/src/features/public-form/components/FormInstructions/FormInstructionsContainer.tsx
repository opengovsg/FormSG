import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useFormSections } from '../FormFields/FormSectionsContext'

import { FormInstructions } from './FormInstructions'

export const FormInstructionsContainer = (): JSX.Element | null => {
  const { sectionRefs } = useFormSections()
  const { form } = usePublicFormContext()

  return (
    <FormInstructions
      content={form?.startPage.paragraph}
      colorTheme={form?.startPage.colorTheme}
      ref={sectionRefs['instructions']}
    />
  )
}
