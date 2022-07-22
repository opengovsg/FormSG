import { Text } from '@chakra-ui/react'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import { useEnvMutations } from '~features/env/mutations'

export const PublicSwitchEnvMessage = (): JSX.Element => {
  const { publicSwitchEnvMutation } = useEnvMutations()

  return (
    <InlineMessage variant="warning" mb="1.5rem" mt={{ base: '2rem', md: '0' }}>
      <Text>
        You’re filling this form on the new FormSG. If you have trouble
        submitting,{' '}
        <Button variant="link" onClick={() => publicSwitchEnvMutation.mutate}>
          switch to the original one here.
        </Button>
      </Text>
    </InlineMessage>
  )
}
