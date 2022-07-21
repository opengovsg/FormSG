import { Text } from '@chakra-ui/react'

import { UiCookieValues } from '~shared/types'

import { publicChooseEnvironment } from '~services/EnvService'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'

export const SwitchEnvMessage = (): JSX.Element => {
  const switchToUi = UiCookieValues.Angular

  const handleClick = async () => {
    await publicChooseEnvironment(switchToUi)
    window.location.reload()
  }

  return (
    <InlineMessage variant="warning" mb="1.5rem">
      <Text>
        You’re filling this form on the new FormSG. If you have trouble
        submitting,{' '}
        <Link onClick={handleClick}>switch to the original one here.</Link>
      </Text>
    </InlineMessage>
  )
}
