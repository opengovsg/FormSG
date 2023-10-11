import axios from 'axios'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions'

import config from '../../config/config'
import { ControllerHandler } from '../core/core.types'

import { sampleFormFields } from './reform.constants'
import {
  formFieldsPromptBuilder,
  questionListPromptBuilder,
  schemaPromptBuilder,
} from './reform.service'

const openai = new OpenAI({ apiKey: config.openaiApiKey })

export const generateQnsList: ControllerHandler<
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
      model: 'gpt-4',
    })
    return res.send([...messages, chatCompletion.choices[0].message])
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error)
    }
    throw error
  }
}

export const generateFormFields: ControllerHandler<
  unknown,
  unknown,
  {
    prevMessages: { role: string; content: string }[]
    purpose: string
    questions: string
  }
> = async (req, res) => {
  try {
    const prevMessages = [
      ...req.body.prevMessages,
    ] as ChatCompletionMessageParam[]

    const messages: ChatCompletionMessageParam[] = [
      ...prevMessages,
      {
        role: 'user',
        content: formFieldsPromptBuilder(req.body.purpose, req.body.questions),
      },
    ]
    const chatCompletion = await openai.chat.completions.create({
      messages: messages,
      model: 'gpt-4',
    })
    console.log(chatCompletion.choices[0].message)
    return res.send(chatCompletion.choices[0].message)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error)
    }
    throw error
  }
}
