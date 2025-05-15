import { useParams } from 'react-router-dom'
import { Box, Flex, Text } from '@chakra-ui/react'

import { StepData } from '~shared/types'

import {
  BackgroundBox,
  BaseGridLayout,
  LoginGridArea,
  NonMobileSidebarGridArea,
} from '~features/login/LoginPageTemplate'

import { useStatusTracker } from './queries'
import { StatusTrackerStepper } from './StatusPoint'

export const StatusTrackerPage = (): JSX.Element => {
  const { formId, submissionId } = useParams()
  if (!formId) throw new Error('No formId provided')
  if (!submissionId) throw new Error('No submissionId provided')

  const { data, isLoading, error } = useStatusTracker(submissionId)

  //   if (isLoading) return <Spinner />
  if (error || !data || !data.submittedSteps || !data.workflow)
    return <Text>"Something went wrong"</Text>

  const { submittedSteps, workflow } = data

  const activeStep = submittedSteps.length - 1
  const stepData: StepData[] = workflow.map((step, index) => {
    if (index <= activeStep) {
      return {
        name: step.name ? step.name : `Step ${index + 1}`,
        timestamp: submittedSteps[index].submittedAt,
      }
    }
    return { name: step.name ? step.name : `Step ${index + 1}` }
  })

  return (
    <BackgroundBox>
      <BaseGridLayout flex={1}>
        <NonMobileSidebarGridArea
          maxW="100%"
          aria-hidden
        ></NonMobileSidebarGridArea>
        <LoginGridArea>
          <Box>
            <Flex direction="column">
              <Text textStyle="h4">Response ID: {data.responseId}</Text>
              <StatusTrackerStepper
                steps={stepData}
                activeStep={activeStep + 1}
              />
            </Flex>
          </Box>
        </LoginGridArea>
      </BaseGridLayout>
    </BackgroundBox>
  )
}
