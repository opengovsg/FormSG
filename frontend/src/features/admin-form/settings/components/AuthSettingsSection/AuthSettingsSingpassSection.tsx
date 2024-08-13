import { Divider } from '@chakra-ui/react'

import { FormResponseMode, FormSettings } from '~shared/types/form'

import { FormNricMaskToggle } from './FormNricMaskToggle'
import { FormSingleSubmissionToggle } from './FormSingleSubmissionToggle'
import { FormWhitelistAttachmentField } from './FormWhitelistAttachmentField'
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
  const isSingpassSettingsDisabled = isFormPublic
  const isSinglepassAuthOptionsDisabled =
    isSingpassSettingsDisabled || containsMyInfoFields
  const isEncryptMode = settings.responseMode === FormResponseMode.Encrypt

  return (
    <>
      <SingpassAuthOptionsRadio
        settings={settings}
        isDisabled={isSinglepassAuthOptionsDisabled}
      />
      {/* Hide the NRIC mask toggle if they have not yet enabled it as part of
      PMO circular */}
      {settings.isNricMaskEnabled ? (
        <>
          <Divider my="2.5rem" />
          <FormNricMaskToggle
            settings={settings}
            isDisabled={isSingpassSettingsDisabled}
          />
        </>
      ) : null}
      {isEncryptMode || settings.isSingleSubmission ? (
        <>
          <Divider my="2.5rem" />
          <FormSingleSubmissionToggle
            settings={settings}
            isDisabled={isSingpassSettingsDisabled}
          />
        </>
      ) : null}
      <Divider my="2.5rem" />
      {isEncryptMode ? (
        <FormWhitelistAttachmentField
          settings={settings}
          isDisabled={isSingpassSettingsDisabled}
        />
      ) : null}
    </>
  )
}
