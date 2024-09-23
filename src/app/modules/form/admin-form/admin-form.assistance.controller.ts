import { celebrate, Joi, Segments } from 'celebrate'

import { ControllerHandler } from '../../core/core.types'

import { sendPromptToModel } from './admin-form.assistance.service'

const handleTextPromptValidator = celebrate({
  [Segments.PARAMS]: {
    formId: Joi.string()
      .required()
      .pattern(/^[a-fA-F0-9]{24}$/)
      .message('Your form ID is invalid.'),
  },
  [Segments.BODY]: {
    prompt: Joi.string().required(),
  },
})

interface ITextPrompt {
  prompt: string
}

const _handleTextPrompt: ControllerHandler<
  { formId: string },
  { message: string },
  ITextPrompt
> = async (req, res) => {
  const response = await sendPromptToModel(req.body.prompt)
  return res.json({
    message: response ?? 'No response received from model',
  })
}

export const handleTextPrompt = [
  handleTextPromptValidator,
  _handleTextPrompt,
] as ControllerHandler[]
