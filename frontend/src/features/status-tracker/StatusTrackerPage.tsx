import { useParams } from 'react-router-dom'
import { Flex, Text } from '@chakra-ui/react'

import { useStatusTracker } from './queries'

export const StatusTrackerPage = (): JSX.Element => {
  const { formId, submissionId } = useParams()
  if (!formId) throw new Error('No formId provided')
  if (!submissionId) throw new Error('No submissionId provided')

  const { data, isLoading, error } = useStatusTracker(submissionId)

  //   if (isLoading) return <Spinner />
  if (error || !data) return <Text>"Something went wrong"</Text>

  return (
    <Flex direction="column">
      <Text>Hello World!</Text>
      <Text>{formId}</Text>
      <Text>{submissionId}</Text>
      <Text>{JSON.stringify(data.submittedSteps)}</Text>
      <Text>{JSON.stringify(data.workflow)}</Text>
    </Flex>
  )
}
