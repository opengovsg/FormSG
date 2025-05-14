import { useParams } from 'react-router-dom'
import { Flex, Text } from '@chakra-ui/react'

import { useStatusTracker } from './queries'

export const StatusTrackerPage = (): JSX.Element => {
  const { formId, submissionId } = useParams()
  if (!formId) throw new Error('No formId provided')
  if (!submissionId) throw new Error('No submissionId provided')

  const { data } = useStatusTracker(formId, submissionId)

  return (
    <Flex>
      <Text>Hello World!</Text>
      <Text>{formId}</Text>
      <Text>{submissionId}</Text>
    </Flex>
  )
}
