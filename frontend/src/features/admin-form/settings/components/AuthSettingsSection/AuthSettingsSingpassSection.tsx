import { Divider } from '@chakra-ui/react'

import { FormSettings } from '~shared/types/form'

import { FormNricMaskToggle } from './FormNricMaskToggle'
import { SingpassAuthOptionsRadio } from './SingpassAuthOptionsRadio'

export interface AuthSettingsSingpassSectionProps {
  settings: FormSettings
  isDisabled: boolean
}

export const AuthSettingsSingpassSection = ({
  settings,
  isDisabled,
}: AuthSettingsSingpassSectionProps): JSX.Element => {
  return (
    <>
      <SingpassAuthOptionsRadio settings={settings} isDisabled={isDisabled} />
      <Divider my="2.5rem" />
      <FormNricMaskToggle settings={settings} isDisabled={isDisabled} />
    </>
  )
}
