import { useFormFeedback } from './queries'

export const FeedbackPage = (): JSX.Element => {
  const { data, isLoading } = useFormFeedback()
  console.log('data is')
  console.log(data)

  return <>{isLoading ? 'Loading' : 'Finished'}</>
}
