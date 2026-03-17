import { FormColorTheme } from 'formsg-shared/types'

import { usePublicFormContext } from '../PublicFormContext'

export const useFormColorTheme = (): FormColorTheme | undefined => {
  const { form } = usePublicFormContext()
  return form?.startPage.colorTheme
}
