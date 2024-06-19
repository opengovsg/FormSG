import { Divider } from '@chakra-ui/react'

import { FormSettings } from '~shared/types/form'

import { FormNricMaskToggle } from './FormNricMaskToggle'
import { SingpassAuthOptionsRadio } from './SingpassAuthOptionsRadio'

export interface AuthSettingsSingpassSectionProps {
  settings: FormSettings
}

export const AuthSettingsSingpassSection = ({
  settings,
}: AuthSettingsSingpassSectionProps): JSX.Element => {
  return (
    <>
      <SingpassAuthOptionsRadio settings={settings} />
      <Divider my="2.5rem" />
      <FormNricMaskToggle settings={settings} />
    </>
  )
}
