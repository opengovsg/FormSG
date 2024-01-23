import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions'

import { ControllerHandler } from '../../core/core.types'

import { sampleFormFields } from './admin-form.assistance.constants'
import {
  formFieldsPromptBuilder,
  migratePromptBuilder,
  questionListPromptBuilder,
  schemaPromptBuilder,
} from './admin-form.assistance.service'

const openai = new OpenAI({
  apiKey: 'fake-key',
})
export const generateQuestions: ControllerHandler<
  unknown,
  unknown,
  { purpose: string }
> = async (req, res) => {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: schemaPromptBuilder(sampleFormFields) },
    {
      role: 'user',
      content: questionListPromptBuilder(req.body.purpose),
    },
  ]
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: messages,
      model: 'gpt-3.5-turbo',
    })
    return res
      .status(200)
      .json([...messages, chatCompletion.choices[0].message])
  } catch (error) {
    console.log(error)
    return res.status(500).send({ message: error })
  }
}

export const generateFormFields: ControllerHandler<
  unknown,
  unknown,
  {
    type: string
    content: string
  }
> = async (req, res) => {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: schemaPromptBuilder(sampleFormFields) },
  ]
  switch (req.body.type) {
    case 'questions':
      messages.push({
        role: 'user',
        content: formFieldsPromptBuilder(req.body.content),
      })
      break
    case 'pdf':
      messages.push({
        role: 'user',
        content: migratePromptBuilder(req.body.content),
      })
      break
    default:
      return res.status(400).send({ message: 'Unknown type' })
  }
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: messages,
      model: 'gpt-3.5-turbo',
    })
    return res.status(200).json(chatCompletion.choices[0].message)
  } catch (error) {
    console.log(error)
    return res.status(500).send({ message: error })
  }
}
