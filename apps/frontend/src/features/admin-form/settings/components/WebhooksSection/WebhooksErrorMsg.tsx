import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const { title, body, button } = t(
    'features.adminForm.settings.webhooks.error',
    {
      returnObjects: true,
    },
  )
  return (
    <Flex justify="center" flexDir="column" textAlign="center" role="alert">
      <Text textStyle="h2" as="h2" color="primary.500" mb="1rem">
        {title}
      </Text>
      <Text textStyle="body-1" color="secondary.500" mb="2.5rem">
        {body}
      </Text>
      <Flex justify="center">
        <Button
          isLoading={isRetrying}
          loadingText={button.loadingText}
          onClick={() => void onRetry()}
        >
          {button.label}
        </Button>
      </Flex>
    </Flex>
  )
}
