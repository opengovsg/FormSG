import { useParams } from 'react-router-dom'
import {
  Box,
  Flex,
  GridItem,
  GridProps,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react'

import { StepData, WorkflowStatus } from '~shared/types'

import { AppFooter } from '~/app/AppFooter'

import { FCC } from '~typings/react'

import { FooterLinkWithIcon } from '~components/Footer/common/types'
import { AppGrid } from '~templates/AppGrid'

import {
  BackgroundBox,
  // BaseGridLayout,
  FooterGridArea,
  LoginGridArea,
} from '~features/login/LoginPageTemplate'

import { useStatusTracker } from './queries'
import { TimelineRunSteps } from './StatusPoint'

// Grid area styling for the left sidebar that only displays on tablet and desktop breakpoints.
const StatusTrackerFormInfoGridArea: FCC = ({ children }) => (
  <GridItem
    mt={{ base: '1rem', lg: '8.125rem', md: '1.125rem' }}
    display={{ base: 'flex', md: 'flex' }}
    gridColumn={{ base: '1 / -1', md: '1 / 13', lg: '2 / 6' }}
    // colSpan={{ base: '-1', md: 12, lg: 5 }}
    pl={{ base: '1.5rem', lg: '8%' }}
    h={{ md: '20.5rem', lg: 'auto' }}
    pt={{ base: '1.5rem', lg: '3rem' }}
    pb={{ base: '1.5rem', lg: '3rem' }}
    flexDir="column"
    alignItems={{ base: 'center', lg: 'flex-end' }}
    bgGradient={{
      base: 'linear(to-b, primary.500 100%, primary.500 100%)',
    }}
    justifyContent="center"
    children={children}
    mx={{ base: '-1.5rem', lg: '0' }} // negative horizontal margin matching the container padding
  />
)

// Component that controls the various grid areas according to responsive breakpoints.
const BaseGridLayout = (props: GridProps) => (
  <AppGrid
    templateRows={{ md: 'auto 1fr auto', lg: '1fr auto' }}
    alignItems="start"
    {...props}
  />
)

const StatusTrackerFormInfo = (): JSX.Element => {
  return (
    <Box w="100%">
      <Flex direction="row">
        <Text textStyle="body-2" color="#FFFFFF">
          FORM TITLE
        </Text>
      </Flex>
      <Text textStyle="h6" color="#FFFFFF" mt="1rem">
        Track your FormSG Response status
      </Text>
    </Box>
  )
}

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
        <StatusTrackerFormInfoGridArea>
          <StatusTrackerFormInfo />
        </StatusTrackerFormInfoGridArea>
        <LoginGridArea>
          <Box mt={{ base: '1rem', lg: '10.125rem' }}>
            <Flex direction="column">
              <Text mb="2rem" textStyle="h4">
                Response ID: {data.responseId}
              </Text>
              <TimelineRunSteps steps={stepData} />
            </Flex>
          </Box>
        </LoginGridArea>
      </BaseGridLayout>
      <BaseGridLayout bg={{ base: 'primary.100', lg: 'transparent' }}>
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
