import axios from 'axios'

import { ControllerHandler } from '../core/core.types'

import {
  OPENAI_API_KEY,
  OPENAI_ENDPOINT,
  sampleFormFields,
} from './reform.constants'
import {
  formFieldsPromptBuilder,
  questionListPromptBuilder,
  schemaPromptBuilder,
} from './reform.service'

type OpenAIResponse = {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export const generateQnsList: ControllerHandler<
  unknown,
  unknown,
  { purpose: string }
> = async (req, res) => {
  const headers = {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  }

  const messages = [
    { role: 'system', content: schemaPromptBuilder(sampleFormFields) },
    {
      role: 'user',
      content: questionListPromptBuilder(req.body.purpose),
    },
  ]

  try {
    const response = await axios.post<OpenAIResponse>(
      OPENAI_ENDPOINT,
      {
        model: 'gpt-3.5-turbo',
        messages,
      },
      {
        headers: {
          ...headers,
          // Required due to bug introduced in axios 1.2.1: https://github.com/axios/axios/issues/5346
          // TODO: remove when axios is upgraded to 1.2.2
          'Accept-Encoding': 'gzip,deflate,compress',
        },
      },
    )
    return res.send([...messages, response.data.choices[0].message])
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
  const headers = {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  }

  try {
    const response = await axios.post<OpenAIResponse>(
      OPENAI_ENDPOINT,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          ...req.body.prevMessages,
          {
            role: 'user',
            content: formFieldsPromptBuilder(
              req.body.purpose,
              req.body.questions,
            ),
          },
        ],
      },
      {
        headers: {
          ...headers,
          // Required due to bug introduced in axios 1.2.1: https://github.com/axios/axios/issues/5346
          // TODO: remove when axios is upgraded to 1.2.2
          'Accept-Encoding': 'gzip,deflate,compress',
        },
      },
    )
    console.log(response.data.choices[0].message)
    return res.send(response.data.choices[0].message)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error)
    }
    throw error
  }
}
