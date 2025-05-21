import { useParams } from 'react-router-dom'
import {
  Box,
  Flex,
  GridItem,
  GridProps,
  Image,
  Link,
  Text,
} from '@chakra-ui/react'

import {
  FormColorTheme,
  FormLogoState,
  StepData,
  WorkflowStatus,
} from '~shared/types'

import { AppFooter } from '~/app/AppFooter'

import { FCC } from '~typings/react'

import { FooterLinkWithIcon } from '~components/Footer/common/types'
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
  FormBannerLogo,
  FormBannerLogoProps,
  PublicFormLogo,
  useFormBannerLogo,
} from '~features/public-form/components/FormLogo'

import { useStatusTracker } from './queries'
import { TimelineRunSteps } from './StatusPoint'
import { StatusTrackerSkeletonPage } from './StatusTrackerSkeletonPage'

const FORMSG_LOGO_URL = 'https://file.go.gov.sg/formslogotransparent120px.png'

type StatusTrackerFormInfoProps = FormBannerLogoProps & {
  isLoading?: boolean
  loggedInId?: string
  onLogout?: () => void
}

// Grid area styling for the left sidebar that only displays on tablet and desktop breakpoints.
export const StatusTrackerFormInfoGridArea: FCC = ({ children }) => (
  <GridItem
    mt={{ base: '1rem', lg: '8.125rem', md: '1.125rem' }}
    display={{ base: 'flex', md: 'flex' }}
    gridColumn={{ base: '1 / -1', md: '1 / 13', lg: '2 / 6' }}
    // colSpan={{ base: '-1', md: 12, lg: 5 }}
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
  return (
    <Box w="100%">
      <Flex direction="row" alignItems="center" gap="0.5rem">
        {/* <FormBannerLogo {...logoProps} /> */}
        <Image
          src={FORMSG_LOGO_URL}
          alt={'test'}
          boxSize={'3rem'}
          objectFit="contain"
        />
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

  // const { data: { logoBucketUrl } = {} } = useEnv(
  //   data?.form?.startPage.logo.state === FormLogoState.Custom,
  // )

  // const statusTrackerLogoProps = useFormBannerLogo({
  //   // logoBucketUrl,
  //   logoBucketUrl: FORMSG_LOGO_URL,
  //   // logo: data?.form?.startPage.logo,
  //   logo: undefined,
  //   agency: data?.form?.admin.agency,
  //   colorTheme: data?.form?.startPage.colorTheme,
  //   showDefaultLogoIfNoLogo: true,
  // })

  if (isLoading) return <StatusTrackerSkeletonPage />

  if (error || !data || !data.submittedSteps || !data.workflow)
    return <NotFoundErrorPage />

  const { submittedSteps, workflow, form } = data

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
      <StatusTrackerBaseGridLayout flex={1}>
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
  )
}
