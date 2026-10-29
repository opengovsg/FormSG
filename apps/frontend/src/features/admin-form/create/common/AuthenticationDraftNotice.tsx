import { ListItem, Text, UnorderedList } from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'

import { useAuthenticationPublishErrors } from './useAuthenticationPublishErrors'

export const AuthenticationDraftNotice = (): JSX.Element | null => {
  const errors = useAuthenticationPublishErrors()
  if (!errors.length) return null
  return (
    <InlineMessage
      id="authentication-publish-errors"
      variant="warning"
      mb="1.5rem"
    >
      <Text textStyle="subhead-2">
        Finish authentication setup before publishing
      </Text>
      <Text textStyle="body-2">
        You can keep editing this draft. Configure matching authentication for
        these fields, or delete the unused fields.
      </Text>
      <UnorderedList mt="0.5rem" spacing="0.25rem">
        {errors.map((error) => (
          <ListItem key={error}>{error}</ListItem>
        ))}
      </UnorderedList>
    </InlineMessage>
  )
}
