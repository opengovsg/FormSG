import axios from 'axios'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions'

import config from '../../config/config'
import { ControllerHandler } from '../core/core.types'

import { sampleFormFields } from './reform.constants'
import {
  formFieldsPromptBuilder,
  migratePromptBuilder,
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
      messages,
      model: 'gpt-4',
    })
    return res
      .status(200)
      .json([...messages, chatCompletion.choices[0].message])
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error)
    }
    return res.status(500).send({ message: error })
  }
}

export const generateFormFields: ControllerHandler<
  unknown,
  unknown,
  {
    prevMessages: { role: string; content: string }[]
    purpose: string
    questions: string
    formName: string
  }
> = async (req, res) => {
  try {
    const prevMessages = req.body.prevMessages as ChatCompletionMessageParam[]

    const messages: ChatCompletionMessageParam[] = [
      ...prevMessages,
      {
        role: 'user',
        content: formFieldsPromptBuilder(
          req.body.purpose,
          req.body.questions,
          req.body.formName,
        ),
      },
    ]
    const chatCompletion = await openai.chat.completions.create({
      messages,
      model: 'gpt-4',
    })
    return res.status(200).json(chatCompletion.choices[0].message)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error)
    }
    return res.status(500).send({ message: error })
  }
}

export const generateFormFieldsFromParsedPdf: ControllerHandler<
  unknown,
  unknown,
  {
    parsedPdfContent: string
  }
> = async (req, res) => {
  try {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: schemaPromptBuilder(sampleFormFields) },
      {
        role: 'user',
        content: migratePromptBuilder(req.body.parsedPdfContent),
      },
    ]
    const chatCompletion = await openai.chat.completions.create({
      messages,
      model: 'gpt-4',
    })
    return res
      .status(200)
      .json([...messages, chatCompletion.choices[0].message])
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error)
    }
    return res.status(500).send({ message: error })
  }
}
