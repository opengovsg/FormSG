import { useParams } from 'react-router-dom'
import { Box, Flex, GridItem, Text } from '@chakra-ui/react'

import { StepData, WorkflowStatus } from '~shared/types'

import { FCC } from '~typings/react'

import {
  BackgroundBox,
  BaseGridLayout,
  FooterGridArea,
  LoginGridArea,
  NonMobileSidebarGridArea,
} from '~features/login/LoginPageTemplate'

import { useStatusTracker } from './queries'
import { TimelineRunSteps } from './StatusPoint'
import { AppFooter } from '~/app/AppFooter'

// Grid area styling for the left sidebar that only displays on tablet and desktop breakpoints.
export const NonMobileSidebarGridAreaStatusTracker: FCC = ({ children }) => (
  <GridItem
    display={{ base: 'none', md: 'flex' }}
    gridColumn={{ md: '1 / 13', lg: '2 / 6' }}
    // colSpan={{ md: 12, lg: 5 }}
    // pl={{ base: '1.5rem', lg: '8%' }}
    h={{ md: '20.5rem', lg: 'auto' }}
    pt={{ base: '1.5rem', md: '2.5rem', lg: '3rem' }}
    pb={{ lg: '3rem' }}
    flexDir="column"
    alignItems={{ base: 'center', lg: 'flex-end' }}
    justifyContent="center"
    children={children}
  />
)

export const StatusTrackerPage = (): JSX.Element => {
  const { formId, submissionId } = useParams()
  if (!formId) throw new Error('No formId provided')
  if (!submissionId) throw new Error('No submissionId provided')

  const { data, isLoading, error } = useStatusTracker(submissionId)

  //   if (isLoading) return <Spinner />
  if (error || !data || !data.submittedSteps || !data.workflow)
    return <Text>"Something went wrong"</Text>

  const { submittedSteps, workflow } = data

  const workflowSteps = submittedSteps.length - 1
  const stepData: StepData[] = workflow.map((step, index) => {
    const name = step.name ? step.name : `Step ${index + 1}`
    const stepNumber = index + 1
    const workflowStatus =
      index <= workflowSteps
        ? submittedSteps[index].isApproval // if it is a workflow approval
          ? workflow[index].approval_field // if this step is an approval step
            ? submittedSteps[index].status
            : WorkflowStatus.COMPLETED
          : WorkflowStatus.COMPLETED
        : WorkflowStatus.PENDING

    if (index <= workflowSteps) {
      return {
        name: name,
        stepNumber: stepNumber,
        timestamp: submittedSteps[index].submittedAt,
        workflowStatus: workflowStatus,
      }
    }

    return {
      name: name,
      stepNumber: stepNumber,
      workflowStatus: workflowStatus,
    }
  })

  return (
    <BackgroundBox>
      <BaseGridLayout flex={1}>
        <NonMobileSidebarGridAreaStatusTracker maxW="100%" aria-hidden>
          <Box w="100%">
            <Flex direction="row">
              <Text>FORM TITLE</Text>
            </Flex>
            <Text textStyle="h6">Track your FormSG Response status</Text>
          </Box>
        </NonMobileSidebarGridAreaStatusTracker>
        <LoginGridArea>
          <Box>
            <Flex direction="column">
              <Text mb="2rem" textStyle="h4">
                Response ID: {data.responseId}
              </Text>
              <TimelineRunSteps steps={stepData} />
            </Flex>
          </Box>
        </LoginGridArea>
        <FooterGridArea>
          <AppFooter
            compactMonochromeLogos
            variant="compact"
            containerProps={{
              px: 0,
              bg: 'transparent',
            }}
          />
        </FooterGridArea>
      </BaseGridLayout>
    </BackgroundBox>
  )
}
