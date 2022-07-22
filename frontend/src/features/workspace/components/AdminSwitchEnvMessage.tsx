// TODO #4279: Remove after React rollout is complete
import { Text } from '@chakra-ui/react'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import { useEnvMutations } from '~features/env/mutations'

export const AdminSwitchEnvMessage = (): JSX.Element => {
  const { adminSwitchEnvMutation } = useEnvMutations()

  return (
    <InlineMessage>
      <Text>
        Welcome to the new FormSG! You can still{' '}
        <Button variant="link" onClick={() => adminSwitchEnvMutation.mutate}>
          <Text as="u">switch to the original one,</Text>
        </Button>{' '}
        which is available until 28 May 2022.
      </Text>
    </InlineMessage>
  )
}
