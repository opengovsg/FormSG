import mongoose from 'mongoose'

import { IFormSchema } from 'src/types'

import getFormModel from '../../models/form.server.model'

const Form = getFormModel(mongoose)

export const deactivateForm = async (
  formId: string,
): Promise<IFormSchema | null> => {
  return Form.deactivateById(formId)
}
