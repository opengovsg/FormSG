import { Divider } from '@chakra-ui/react'
import { useFeatureIsOn, useFeatureValue } from '@growthbook/growthbook-react'

import { featureFlags } from '~shared/constants/feature-flags'
import { FormResponseMode, FormSettings } from '~shared/types/form'

import { FormSubmitterIdCollectionToggle } from './FormNricCollectionToggle'
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

  const isSubmitterIdCollectionFeatureOn = useFeatureIsOn(
    featureFlags.submitterIdCollection,
  )

  return (
    <>
      <SingpassAuthOptionsRadio
        settings={settings}
        isDisabled={isSinglepassAuthOptionsDisabled}
      />
      {isSubmitterIdCollectionFeatureOn ? (
        <>
          <Divider my="2.5rem" />
          <FormSubmitterIdCollectionToggle
            settings={settings}
            isDisabled={isFormPublic}
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
