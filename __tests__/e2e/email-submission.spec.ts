import { allFields } from './constants/field'
import { test } from './fixtures/auth'
import { createForm } from './utils/form'
import { submitForm } from './utils/submit'

test.describe('email form submission', () => {
  test('Create and submit email mode form with all fields', async ({
    page,
  }) => {
    const formFields = allFields
    const formId = await createForm(page, { formFields })
    await submitForm(page, { formId, formFields })
  })
})
