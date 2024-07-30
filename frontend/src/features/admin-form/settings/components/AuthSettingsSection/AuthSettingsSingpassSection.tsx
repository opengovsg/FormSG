import { Divider } from '@chakra-ui/react'

import { FormResponseMode, FormSettings } from '~shared/types/form'

import { FormNricMaskToggle } from './FormNricMaskToggle'
import { FormSingleSubmissionToggle } from './FormSingleSubmissionToggle'
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
      {/* Hide the NRIC mask toggle if they have not yet enabled it as part of
      PMO circular */}
      {settings.isNricMaskEnabled ? (
        <>
          <Divider my="2.5rem" />
          <FormNricMaskToggle settings={settings} isDisabled={isFormPublic} />
        </>
      ) : null}
      {settings.isSingleSubmission ||
      settings.responseMode === FormResponseMode.Encrypt ? (
        <>
          <Divider my="2.5rem" />
          <FormSingleSubmissionToggle
            settings={settings}
            isDisabled={isFormPublic}
          />
        </>
      ) : null}
    </>
  )
}
