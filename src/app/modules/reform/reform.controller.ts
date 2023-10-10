import axios from 'axios'

import { ControllerHandler } from '../core/core.types'

import { sampleFormFields } from './reform.constants'
import { schemaPromptBuilder, userPromptBuilder } from './reform.service'

type OpenAIResponse = {
  id: string
  object: string
  created: number
  model: string
  choices: {
    text: string
    index: number
  }[]
}

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'
const API_KEY = 'YOUR_OPENAI_API_KEY' // Replace with your OpenAI API key

export const callOpenAI: ControllerHandler<
  unknown,
  unknown,
  { purpose: string }
> = async (req, res) => {
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  }

  try {
    const response = await axios.post<OpenAIResponse>(
      OPENAI_ENDPOINT,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: schemaPromptBuilder(sampleFormFields) },
          { role: 'user', content: userPromptBuilder(req.body.purpose) },
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
    return res.send(response.data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error)
    }
    throw error
  }
}
