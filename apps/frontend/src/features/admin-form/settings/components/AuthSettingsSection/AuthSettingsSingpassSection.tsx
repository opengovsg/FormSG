import { Divider } from '@chakra-ui/react'

import { FormResponseMode, FormSettings } from 'formsg-shared/types/form'

import { FormSingleSubmissionToggle } from './FormSingleSubmissionToggle'
import { FormWhitelistAttachmentField } from './FormWhitelistAttachmentField'
import { SingpassAuthOptionsRadio } from './SingpassAuthOptionsRadio'
import { SubmitterIdCollectionSection } from './SubmitterIdCollectionSection'

export interface AuthSettingsSingpassSectionProps {
  settings: FormSettings
  isFormPublic: boolean
  hasLoginFields: boolean
  hasIdentityFields: boolean
  nextQuestionNumber?: number
}

export const AuthSettingsSingpassSection = ({
  settings,
  isFormPublic,
  hasLoginFields,
  hasIdentityFields,
  nextQuestionNumber,
}: AuthSettingsSingpassSectionProps): JSX.Element => {
  const isSingpassSettingsDisabled = isFormPublic
  const isSinglepassAuthOptionsDisabled =
    isSingpassSettingsDisabled || hasLoginFields
  const isEncryptOrMultirespondentMode =
    settings.responseMode === FormResponseMode.Encrypt ||
    settings.responseMode === FormResponseMode.Multirespondent

  return (
    <>
      <SingpassAuthOptionsRadio
        settings={settings}
        isDisabled={isSinglepassAuthOptionsDisabled}
      />
      <SubmitterIdCollectionSection
        settings={settings}
        isFormPublic={isFormPublic}
        hasIdentityFields={hasIdentityFields}
        nextQuestionNumber={nextQuestionNumber}
        divider={<Divider my="2.5rem" />}
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
