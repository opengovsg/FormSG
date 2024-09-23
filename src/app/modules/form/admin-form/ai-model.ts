import { AzureOpenAI } from 'openai'
import type { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/index'

import { azureOpenAIConfig } from '../../../config/features/azureopenai.config'

const { endpoint, apiKey, apiVersion, deploymentName } = azureOpenAIConfig

const getClient = (): AzureOpenAI => {
  return new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion,
    deployment: deploymentName,
  })
}

export enum Role {
  User = 'user',
  System = 'system',
}

const MODEL = 'gpt-4o-mini'

export interface Message {
  role: Role
  content: string
}

export const sendUserTextPrompt = async ({
  messages,
  options,
}: {
  messages: Message[]
  options?: Omit<ChatCompletionCreateParamsNonStreaming, 'model' | 'messages'>
}) => {
  const client = getClient()

  const chatCompletionPrompt: ChatCompletionCreateParamsNonStreaming = {
    messages,
    model: MODEL,
    ...options,
  }

  const response = await client.chat.completions.create(chatCompletionPrompt)
  return response.choices[0].message.content
}
