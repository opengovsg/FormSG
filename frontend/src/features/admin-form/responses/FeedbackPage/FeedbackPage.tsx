import { Container } from '@chakra-ui/layout'

import { useFormFeedback } from './queries'

export const FeedbackPage = (): JSX.Element => {
  const { data, isLoading } = useFormFeedback()
  console.log('data is')
  console.log(data)

  return (
    <Container maxW="69.5rem">
      <>{isLoading ? 'Loading' : 'Finished'}</>
    </Container>
  )
}
