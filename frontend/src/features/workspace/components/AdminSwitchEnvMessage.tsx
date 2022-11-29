// TODO #4279: Remove after React rollout is complete
import { KeyboardEventHandler, useCallback, useMemo } from 'react'
import { Text, VisuallyHidden } from '@chakra-ui/react'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import { useEnvMutations } from '~features/env/mutations'
import { useEnv } from '~features/env/queries'

export const AdminSwitchEnvMessage = (): JSX.Element | null => {
  const {
    data: {
      angularPhaseOutDate,
      adminRollout,
      removeAdminInfoboxThreshold,
    } = {},
  } = useEnv()
  // Remove the switch env message if the React rollout for admins is => threshold
  const showSwitchEnvMessage = useMemo(
    () =>
      adminRollout &&
      removeAdminInfoboxThreshold &&
      adminRollout < removeAdminInfoboxThreshold,
    [adminRollout, removeAdminInfoboxThreshold],
  )

  const handleKeydown: KeyboardEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
      }
    },
    [],
  )

  const { adminSwitchEnvMutation } = useEnvMutations()

  const handleClick = useCallback(
    () => adminSwitchEnvMutation.mutate(),
    [adminSwitchEnvMutation],
  )

  return showSwitchEnvMessage ? (
    <>
      <InlineMessage id="admin-switch-msg">
        <Text>
          Welcome to the new FormSG! You can still{' '}
          <Button
            tabIndex={0}
            p={0}
            as="u"
            variant="link"
            display="inline"
            onClick={handleClick}
            onKeyDown={handleKeydown}
            aria-labelledby="admin-switch-msg"
            cursor="pointer"
          >
            <VisuallyHidden>
              Click to switch to the original FormSG
            </VisuallyHidden>
            <Text as="span" display="inline" aria-hidden>
              switch to the original one
            </Text>
          </Button>
          , which is available until {angularPhaseOutDate}.
        </Text>
      </InlineMessage>
    </>
  ) : null
}
