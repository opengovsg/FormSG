import { ChatResponseMessage } from '@azure/openai/types/openai'

import { ErrorDto } from '../../../../../shared/types'
import { ControllerHandler } from '../../core/core.types'

import {
  generateFormFields,
  generateQuestions,
} from './admin-form.assistance.service'

/**
 * Handler for POST /questions
 * @returns 200 when questions are successfully generated
 * @returns 500 when openai server error occurs
 */
export const handleGenerateQuestions: ControllerHandler<
  unknown,
  ChatResponseMessage | ErrorDto,
  {
    type: string
    content: string
  }
> = async (req, res) => {
  const result = await generateQuestions(req.body)
  if (result.isErr()) {
    return res.status(500).json({ message: result.error.message })
  }
  res.status(200).json(result.value)
}

/**
 * Handler for POST /form-fields
 * @returns 200 when form fields are successfully generated
 * @returns 500 when openai server error occurs
 */
export const handleGenerateFormFields: ControllerHandler<
  unknown,
  ChatResponseMessage | ErrorDto,
  {
    content: string
  }
> = async (req, res) => {
  const result = await generateFormFields(req.body.content)
  if (result.isErr()) {
    return res.status(500).json({ message: result.error.message })
  }
  res.status(200).json(result.value)
}
