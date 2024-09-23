import { celebrate, Joi, Segments } from 'celebrate'

import { ControllerHandler } from '../../core/core.types'

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
  undefined,
  ITextPrompt
> = (req, res) => {
  setTimeout(() => {
    res.send()
  }, 3_000)
  return
}

export const handleTextPrompt = [
  handleTextPromptValidator,
  _handleTextPrompt,
] as ControllerHandler[]
