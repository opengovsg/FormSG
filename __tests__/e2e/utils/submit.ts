import { Page } from '@playwright/test'

import { E2eFieldMetadata } from '../constants/field'
import { PUBLIC_FORM_PAGE_PREFIX } from '../constants/links'

type SubmitFormProps = {
  formId: string
  formFields: E2eFieldMetadata[]
}

export const submitForm = async (
  page: Page,
  { formId, formFields }: SubmitFormProps,
): Promise<void> => {
  await page.goto(`${PUBLIC_FORM_PAGE_PREFIX}/${formId}`)
}
