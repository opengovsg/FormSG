import { useTranslation } from 'react-i18next'
import {
  Box,
  ListItem,
  SpaceProps,
  Text,
  UnorderedList,
} from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'

import { useAuthenticationPublishErrors } from './useAuthenticationPublishErrors'

const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin.publishErrors'

export const AUTHENTICATION_DRAFT_NOTICE_ID = 'authentication-publish-errors'

export interface AuthenticationDraftNoticeProps {
  /** What the form needs before it can be opened, from the form status toggle. */
  activationRequirement?: string
  mb?: SpaceProps['mb']
}

/**
 * The one place that says why a form can't be opened yet. A lone activation
 * requirement shows on its own, and field errors add the list below it.
 */
export const AuthenticationDraftNotice = ({
  activationRequirement,
  mb = '1.5rem',
}: AuthenticationDraftNoticeProps): JSX.Element | null => {
  const { t } = useTranslation()
  const errors = useAuthenticationPublishErrors()
  if (!errors.length && !activationRequirement) return null
  return (
    <InlineMessage
      id={AUTHENTICATION_DRAFT_NOTICE_ID}
      variant="warning"
      mb={mb}
    >
      {errors.length ? (
        <Box minW={0}>
          <Text textStyle="subhead-2">{t(`${COPY_KEY}.title`)}</Text>
          {activationRequirement ? (
            <Text textStyle="body-2">{activationRequirement}</Text>
          ) : null}
          <Text textStyle="body-2">{t(`${COPY_KEY}.description`)}</Text>
          <UnorderedList mt="0.5rem" spacing="0.25rem">
            {errors.map((error) => (
              <ListItem key={error}>{error}</ListItem>
            ))}
          </UnorderedList>
        </Box>
      ) : (
        activationRequirement
      )}
    </InlineMessage>
  )
}
