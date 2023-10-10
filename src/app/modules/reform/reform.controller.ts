import axios from 'axios'

type OpenAIRequest = {
  prompt: string
  max_tokens?: number
  // ... any other parameters you wish to set
}

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

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/engines/davinci/completions'
const API_KEY = 'YOUR_OPENAI_API_KEY' // Replace with your OpenAI API key

async function callOpenAI(request: OpenAIRequest): Promise<OpenAIResponse> {
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'YOUR_APP_NAME', // Replace with your app's name or identifier
  }

  try {
    const response = await axios.post<OpenAIResponse>(
      OPENAI_ENDPOINT,
      request,
      {
        headers,
      },
    )
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error)
    }
    throw error
  }
}
