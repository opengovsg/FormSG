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
 * requirement shows on its own. With field errors, it leads the list.
 */
export const AuthenticationDraftNotice = ({
  activationRequirement,
  mb = '1.5rem',
}: AuthenticationDraftNoticeProps): JSX.Element | null => {
  const { t } = useTranslation()
  const errors = useAuthenticationPublishErrors()
  if (!errors.length && !activationRequirement) return null
  const items = activationRequirement
    ? [activationRequirement, ...errors]
    : errors
  return (
    <InlineMessage
      id={AUTHENTICATION_DRAFT_NOTICE_ID}
      variant="warning"
      mb={mb}
    >
      {errors.length ? (
        <Box minW={0}>
          <Text textStyle="subhead-1">{t(`${COPY_KEY}.title`)}</Text>
          <UnorderedList mt="0.5rem" spacing="0.25rem">
            {items.map((item) => (
              <ListItem key={item}>{item}</ListItem>
            ))}
          </UnorderedList>
        </Box>
      ) : (
        activationRequirement
      )}
    </InlineMessage>
  )
}
