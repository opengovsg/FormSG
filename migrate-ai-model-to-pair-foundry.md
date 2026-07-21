For magic form builder and other LLM usages in FormSG application, we are currently using Azure AI foundry. Migrate over to Pair foundry https://docs.foundry.pair.gov.sg/getting-started. 

This is from the pair foundry docs: 
PX Engine is currently using LiteLLM under the hood. The following are some examples of how you can use your api keys to get started

npm install --save @ai-sdk/openai
Proceed to then initialise the client with your api key like so:


  import { createOpenAI } from '@ai-sdk/openai'
  const engineProvider = createOpenAI({
    name: 'pair-engine',
    baseURL: 'https://engine.pair.gov.sg',
    apiKey: "sk-1234567890",
  })
  // In this example, we're using the gpt4o:rsn model.
  const model = engineProvider.chat('gpt4o:rsn')
  // Use the sdk as per normal
  const result = streamText({
    model,
    temperature: 0,
    messages,
  })
It is highly recommended to use vercel's ai sdk. Personally found this to be the fastest way to get things done when prototyping. Using NestJS? See here on how to get started.

Note: The @ai-sdk/openai provider works with any OpenAI-compatible API. If you prefer, you can also use other AI SDK providers like @ai-sdk/anthropic or @ai-sdk/amazon-bedrock with a custom baseURL pointing to the engine.

I want the AI settings to be parameterized and configurable via AWS SSM parameter store. 

Shifting to pair foundry allows us to update our model to the latest LLM models which option support structured outputs to reduce flakiness in a subsequent PR.