import React from 'react'
import ReactWordcloud from 'react-wordcloud'
import { Text, VStack } from '@chakra-ui/react'

export type WordCloudProps = {
  questionTitle: string
  words: { text: string; value: number }[]
  maxWords?: number
  options?: WordCloudOptions
}

type WordCloudOptions = {
  deterministic: boolean
}

const WordCloud = ({
  questionTitle,
  words,
  maxWords = 100,
  options = { deterministic: true },
}: WordCloudProps) => {
  if (!words.length) return null
  return (
    <VStack w="100%" gap="0">
      <Text textStyle="h4" alignSelf="flex-start">
        {questionTitle}
      </Text>
      <ReactWordcloud words={words} options={options} maxWords={maxWords} />
    </VStack>
  )
}

export default React.memo(WordCloud)
