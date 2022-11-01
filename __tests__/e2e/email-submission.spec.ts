import { allFields } from './constants/field'
import { test } from './fixtures/auth'
import { createForm } from './utils/form'

test.describe('email form submission', () => {
  test('Create and submit email mode form with all fields', async ({
    page,
  }) => {
    await createForm(page, { formFields: allFields })
  })
})
