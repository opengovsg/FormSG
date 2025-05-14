import { useParams } from 'react-router-dom'
import { Flex, Text } from '@chakra-ui/react'

export const StatusTrackerPage = (): JSX.Element => {
  const { formId, submissionId } = useParams()

  return (
    <Flex>
      <Text>Hello World!</Text>
      <Text>{formId}</Text>
      <Text>{submissionId}</Text>
    </Flex>
  )
}
