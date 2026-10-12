import { Divider } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode, FormSettings } from 'formsg-shared/types/form'

import { FormSubmitterIdCollectionToggle } from './FormNricCollectionToggle'
import { FormSingleSubmissionToggle } from './FormSingleSubmissionToggle'
import { FormWhitelistAttachmentField } from './FormWhitelistAttachmentField'
import { SingpassAuthOptionsRadio } from './SingpassAuthOptionsRadio'

export interface AuthSettingsSingpassSectionProps {
  settings: FormSettings
  isFormPublic: boolean
  hasLoginFields: boolean
  hasIdentityFields: boolean
}

export const AuthSettingsSingpassSection = ({
  settings,
  isFormPublic,
  hasLoginFields,
  hasIdentityFields,
}: AuthSettingsSingpassSectionProps): JSX.Element => {
  const isNricFieldEnabled = useFeatureIsOn(featureFlags.isNricFieldEnabled)
  const isSingpassSettingsDisabled = isFormPublic
  const isSinglepassAuthOptionsDisabled =
    isSingpassSettingsDisabled || hasLoginFields
  const isEncryptOrMultirespondentMode =
    settings.responseMode === FormResponseMode.Encrypt ||
    settings.responseMode === FormResponseMode.Multirespondent
  // Keep converted forms usable if rollout is paused. Unconverted forms keep
  // the legacy toggle until the flag enables identity fields.
  const usesIdentityFields =
    isEncryptOrMultirespondentMode &&
    !settings.isSubmitterIdCollectionEnabled &&
    (isNricFieldEnabled || hasIdentityFields)

  return (
    <>
      <SingpassAuthOptionsRadio
        settings={settings}
        isDisabled={isSinglepassAuthOptionsDisabled}
      />
      {!usesIdentityFields && (
        <>
          <Divider my="2.5rem" />
          <FormSubmitterIdCollectionToggle
            settings={settings}
            isDisabled={isFormPublic}
          />
        </>
      )}
      <Divider my="2.5rem" />
      <FormSingleSubmissionToggle
        settings={settings}
        isDisabled={isSingpassSettingsDisabled}
      />
      {isEncryptOrMultirespondentMode ? (
        <>
          <Divider my="2.5rem" />
          <FormWhitelistAttachmentField
            settings={settings}
            isDisabled={isSingpassSettingsDisabled}
          />
        </>
      ) : null}
    </>
  )
}
