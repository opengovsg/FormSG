import { useTranslation } from 'react-i18next'
import { Box, ListItem, Text, UnorderedList } from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'

import { useAuthenticationPublishErrors } from './useAuthenticationPublishErrors'

const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin.publishErrors'

export const AuthenticationDraftNotice = (): JSX.Element | null => {
  const { t } = useTranslation()
  const errors = useAuthenticationPublishErrors()
  if (!errors.length) return null
  return (
    <InlineMessage
      id="authentication-publish-errors"
      variant="warning"
      mb="1.5rem"
    >
      <Box minW={0}>
        <Text textStyle="subhead-2">{t(`${COPY_KEY}.title`)}</Text>
        <Text textStyle="body-2">{t(`${COPY_KEY}.description`)}</Text>
        <UnorderedList mt="0.5rem" spacing="0.25rem">
          {errors.map((error) => (
            <ListItem key={error}>{error}</ListItem>
          ))}
        </UnorderedList>
      </Box>
    </InlineMessage>
  )
}
