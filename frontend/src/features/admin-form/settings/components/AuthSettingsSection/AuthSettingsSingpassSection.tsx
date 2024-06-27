import { Divider } from '@chakra-ui/react'

import { FormSettings } from '~shared/types/form'

import { FormNricMaskToggle } from './FormNricMaskToggle'
import { SingpassAuthOptionsRadio } from './SingpassAuthOptionsRadio'

export interface AuthSettingsSingpassSectionProps {
  settings: FormSettings
  isFormPublic: boolean
  containsMyInfoFields: boolean
}

export const AuthSettingsSingpassSection = ({
  settings,
  isFormPublic,
  containsMyInfoFields,
}: AuthSettingsSingpassSectionProps): JSX.Element => {
  return (
    <>
      <SingpassAuthOptionsRadio
        settings={settings}
        isDisabled={isFormPublic || containsMyInfoFields}
      />
      <Divider my="2.5rem" />
      <FormNricMaskToggle settings={settings} isDisabled={isFormPublic} />
    </>
  )
}
