import { Divider } from '@chakra-ui/react'

import { FormResponseMode, FormSettings } from 'formsg-shared/types/form'

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
  const isEncryptOrMultirespondentMode =
    settings.responseMode === FormResponseMode.Encrypt ||
    settings.responseMode === FormResponseMode.Multirespondent

  return (
    <>
      <SingpassAuthOptionsRadio
        settings={settings}
        isDisabled={isSinglepassAuthOptionsDisabled}
      />
      <Divider my="2.5rem" />
      <FormSubmitterIdCollectionToggle
        settings={settings}
        isDisabled={isFormPublic}
      />
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
