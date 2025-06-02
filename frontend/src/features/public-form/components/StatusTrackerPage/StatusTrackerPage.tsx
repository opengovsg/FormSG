import { useParams } from 'react-router-dom'
import { Box, Flex, GridItem, GridProps, Image, Text } from '@chakra-ui/react'

import { FormLogoState, StepData, WorkflowStatus } from '~shared/types'

import { AppFooter } from '~/app/AppFooter'

import { FCC } from '~typings/react'

import { AppGrid } from '~templates/AppGrid'

import NotFoundErrorPage from '~pages/NotFoundError'
import { useEnv } from '~features/env/queries'
import {
  BackgroundBox,
  BaseGridLayout,
  // BaseGridLayout,
  FooterGridArea,
  LoginGridArea,
} from '~features/login/LoginPageTemplate'
import {
  PublicFormLogo,
  useFormBannerLogo,
} from '~features/public-form/components/FormLogo'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'
import { PublicFormProvider } from '~features/public-form/PublicFormProvider'

import { useStatusTracker } from './queries'
import { StatusTrackerSkeletonPage } from './StatusTrackerSkeletonPage'
import { TimelineRunSteps } from './TimelineRunSteps'

// Grid area styling for the left sidebar that only displays on tablet and desktop breakpoints.
export const StatusTrackerFormInfoGridArea: FCC = ({ children }) => (
  <GridItem
    mt={{ base: '1rem', lg: '7.125rem', md: '1.125rem' }}
    display={{ base: 'flex', md: 'flex' }}
    gridColumn={{ base: '1 / -1', md: '1 / 13', lg: '2 / 5' }}
    pl={{ base: '1.5rem', lg: '0%' }}
    h={{ md: '20.5rem', lg: 'auto' }}
    pt={{ base: '1.5rem', lg: '3rem' }}
    pb={{ base: '1.5rem', lg: '3rem' }}
    flexDir="column"
    alignItems={{ base: 'center', lg: 'flex-end' }}
    justifyContent="center"
    children={children}
    bgGradient={{
      base: 'linear(to-b, primary.500 100%, primary.500 100%)',
      md: 'linear(to-b, primary.500 20.5rem, transparent 0)', // match BackgroundBox
      lg: 'linear(to-r, primary.500 calc(41.6667% - 4px), transparent 0)', // match BackgroundBox
    }}
    mx={{ base: '-1.5rem', md: '-1.75rem', lg: '-2rem' }} // negative horizontal margin matching the container padding
    // overflow="hidden"
  />
)

// Component that controls the various grid areas according to responsive breakpoints.
export const StatusTrackerBaseGridLayout = (props: GridProps) => (
  <AppGrid
    templateRows={{ md: 'auto 1fr auto', lg: '1fr auto' }}
    alignItems="start"
    {...props}
  />
)

const StatusTrackerFormInfo = (): JSX.Element => {
  // trying to get logo to work
  const { form } = usePublicFormContext()

  // const { data: { logoBucketUrl } = {} } = useEnv(
  //   form?.startPage.logo.state === FormLogoState.Custom,
  // )

  // const showLogo = form?.startPage.logo.state !== FormLogoState.None

  // const statusTrackerLogoProps = useFormBannerLogo({
  //   logoBucketUrl: logoBucketUrl,
  //   logo: form?.startPage.logo,
  //   agency: form?.admin.agency,
  //   colorTheme: form?.startPage.colorTheme,
  //   showDefaultLogoIfNoLogo: true,
  // })

  return (
    <Box w="100%">
      <Flex direction="row" alignItems="center" gap="0.5rem">
        {/* {showLogo ? (
          <Box
            w="3rem"
            h="3rem"
            borderRadius="full"
            overflow="hidden"
            bg="white"
          >
            <Image
              src={statusTrackerLogoProps.logoImgSrc}
              alt={statusTrackerLogoProps.logoImgAlt}
              objectFit="contain"
              w="100%"
              h="100%"
              p="0.25rem"
            />
          </Box>
        ) : null} */}
        <Text textStyle="body-2" color="#FFFFFF">
          {form?.title}
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

  if (isLoading) return <StatusTrackerSkeletonPage />

  if (error || !data || !data.submittedSteps || !data.workflow)
    return <NotFoundErrorPage />

  const { submittedSteps, workflow } = data

  const stepData: StepData[] = workflow.map((step, index) => {
    const name = step.step_name ? step.step_name : `Step ${index + 1}`
    const stepNumber = index + 1

    const submittedStep = submittedSteps[index]

    const workflowStatus =
      index < submittedSteps.length
        ? workflow[index].approval_field // if this step is an approval step
          ? 'status' in submittedStep // if status is in submitted step
            ? submittedStep.status
            : WorkflowStatus.COMPLETED
          : WorkflowStatus.COMPLETED
        : WorkflowStatus.PENDING

    if (index < submittedSteps.length) {
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
      isCurrentPendingStep: index == submittedSteps.length,
    }
  })

  const startTime = Date.now()
  return (
    <PublicFormProvider formId={formId} startTime={startTime}>
      <BackgroundBox>
        <StatusTrackerBaseGridLayout flex={1}>
          <StatusTrackerFormInfoGridArea>
            <StatusTrackerFormInfo />
          </StatusTrackerFormInfoGridArea>
          <LoginGridArea>
            <Box mt={{ base: '1rem', lg: '2.33rem' }}>
              <Flex direction="column">
                <PublicFormLogo />
                <Text mb="2rem" textStyle="h4">
                  Response ID: {data.responseId}
                </Text>
                <TimelineRunSteps steps={stepData} />
              </Flex>
            </Box>
          </LoginGridArea>
        </StatusTrackerBaseGridLayout>
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
    </PublicFormProvider>
  )
}
