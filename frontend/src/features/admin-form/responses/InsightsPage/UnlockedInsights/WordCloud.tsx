import ReactWordcloud from 'react-wordcloud'
import { Text, VStack } from '@chakra-ui/react'

export type WordCloudProps = {
  questionTitle: string
  words: { text: string; value: number }[]
}

export const WordCloud = ({ words, questionTitle }: WordCloudProps) => {
  if (!words.length) return null
  return (
    <VStack w="100%" gap="0">
      <Text textStyle="h4" alignSelf="flex-start">
        {questionTitle}
      </Text>
      <ReactWordcloud words={words} />
    </VStack>
  )
}
