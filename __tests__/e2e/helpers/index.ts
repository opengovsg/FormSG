import { Page } from '@playwright/test'
import { FormResponseMode } from 'shared/types'

import { IFormModel } from 'src/types'

import { E2eForm } from '../constants'
import { deleteDocById } from '../utils'

import { createForm } from './createForm'
import { submitForm } from './submitForm'
import { verifySubmission } from './verifySubmission'

export * from './createForm'
export * from './submitForm'
export * from './verifySubmission'

export const createSubmissionTestRunnerForResponseMode =
  (responseMode: FormResponseMode) =>
  async (page: Page, Form: IFormModel, formDef: E2eForm): Promise<void> => {
    const { form, formResponseMode } = await createForm(
      page,
      Form,
      responseMode,
      formDef,
    )
    const responseId = await submitForm(page, {
      form,
      ...formDef,
    })
    await verifySubmission(page, {
      form,
      formResponseMode,
      responseId,
      ...formDef,
    })
    await deleteDocById(Form, form._id)
  }
