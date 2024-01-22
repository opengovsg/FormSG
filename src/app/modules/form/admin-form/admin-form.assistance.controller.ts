import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions'

import { ControllerHandler } from '../../core/core.types'

const openai = new OpenAI({
  apiKey: 'fake-key',
})
export const generateQuestions: ControllerHandler = async (req, res) => {
  console.log(req.body)
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: 'test' },
    {
      role: 'user',
      content: 'hello world!',
    },
  ]
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: 'gpt-3.5-turbo',
  })

  console.log(completion.choices[0])
  res.send(completion.choices[0])
}
