import { Flex, Text } from '@chakra-ui/react'

import Button from '~components/Button'

export interface WebhooksErrorMsgProps {
  onRetry: () => void
  isRetrying?: boolean
}

export const WebhooksErrorMsg = ({
  onRetry,
  isRetrying = false,
}: WebhooksErrorMsgProps): JSX.Element => {
  return (
    <Flex justify="center" flexDir="column" textAlign="center" role="alert">
      <Text textStyle="h2" as="h2" color="primary.500" mb="1rem">
        Couldn't load webhook settings
      </Text>
      <Text textStyle="body-1" color="secondary.500" mb="2.5rem">
        Something went wrong while loading this form's settings. This does not
        affect your form or its responses. Please try again.
      </Text>
      <Flex justify="center">
        <Button
          isLoading={isRetrying}
          loadingText="Trying again…"
          onClick={() => void onRetry()}
        >
          Try again
        </Button>
      </Flex>
    </Flex>
  )
}
