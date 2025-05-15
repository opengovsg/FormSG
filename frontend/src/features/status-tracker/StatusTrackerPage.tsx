import { useParams } from 'react-router-dom'
import { Box, Flex, GridItem, Text } from '@chakra-ui/react'

import { useStatusTracker } from './queries'
import {
  BackgroundBox,
  BaseGridLayout,
  LoginGridArea,
  NonMobileSidebarGridArea,
} from '~features/login/LoginPageTemplate'

// // Grid area styling for the login form.
// export const StatusTrackerGridArea: FCC = ({ children }) => (
//   <GridItem
//     gridColumn={{ base: '1 / 5', md: '2 / 12', lg: '7 / 12' }}
//     py="4rem"
//     display="flex"
//     alignItems={{ base: 'initial', lg: 'center' }}
//     justifyContent="center"
//     children={children}
//   />
// )

export const StatusTrackerPage = (): JSX.Element => {
  const { formId, submissionId } = useParams()
  if (!formId) throw new Error('No formId provided')
  if (!submissionId) throw new Error('No submissionId provided')

  const { data, isLoading, error } = useStatusTracker(submissionId)

  //   if (isLoading) return <Spinner />
  if (error || !data) return <Text>"Something went wrong"</Text>

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
              <Text>Hello World!</Text>
              <Text>{formId}</Text>
              <Text>{submissionId}</Text>
              <Text>{JSON.stringify(data.submittedSteps)}</Text>
              <Text>{JSON.stringify(data.workflow)}</Text>
            </Flex>
          </Box>
        </LoginGridArea>
      </BaseGridLayout>
    </BackgroundBox>
  )
}
