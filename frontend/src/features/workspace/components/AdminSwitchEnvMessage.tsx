import { Text } from '@chakra-ui/react'

import { UiCookieValues } from '~shared/types'

import { adminChooseEnvironment } from '~services/EnvService'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'

export const AdminSwitchEnvMessage = (): JSX.Element => {
  const switchToUi = UiCookieValues.Angular

  const handleClick = async () => {
    await adminChooseEnvironment(switchToUi)
    window.location.reload()
  }

  return (
    <InlineMessage mb="1.5rem">
      <Text>
        Welcome to the new FormSG! You can still{' '}
        <Link onClick={handleClick}>switch to the original one,</Link> which is
        available until 28 May 2022.
      </Text>
    </InlineMessage>
  )
}
