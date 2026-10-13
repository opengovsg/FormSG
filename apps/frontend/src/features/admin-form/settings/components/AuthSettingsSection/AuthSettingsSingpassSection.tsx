import { useTranslation } from 'react-i18next'
import { Divider, Stack } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode, FormSettings } from 'formsg-shared/types/form'

import InlineMessage from '~components/InlineMessage'

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
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.singpass.submitterIdCollection',
  })
  const isNricFieldEnabled = useFeatureIsOn(featureFlags.isNricFieldEnabled)
  const isSingpassSettingsDisabled = isFormPublic
  const isSinglepassAuthOptionsDisabled =
    isSingpassSettingsDisabled || hasLoginFields
  const isEncryptOrMultirespondentMode =
    settings.responseMode === FormResponseMode.Encrypt ||
    settings.responseMode === FormResponseMode.Multirespondent
  // Unconverted forms keep the legacy toggle until the flag enables identity
  // fields. If rollout is paused, the toggle stays locked while those fields exist.
  const usesIdentityFields =
    isEncryptOrMultirespondentMode &&
    !settings.isSubmitterIdCollectionEnabled &&
    isNricFieldEnabled
  const isToggleLockedByIdentityFields =
    !settings.isSubmitterIdCollectionEnabled && hasIdentityFields

  return (
    <>
      <SingpassAuthOptionsRadio
        settings={settings}
        isDisabled={isSinglepassAuthOptionsDisabled}
      />
      {!usesIdentityFields && (
        <>
          <Divider my="2.5rem" />
          {isToggleLockedByIdentityFields ? (
            <Stack spacing="1rem">
              <FormSubmitterIdCollectionToggle settings={settings} isDisabled />
              <InlineMessage>{t('removeIdentityFieldsFirst')}</InlineMessage>
            </Stack>
          ) : (
            <FormSubmitterIdCollectionToggle
              settings={settings}
              isDisabled={isFormPublic}
            />
          )}
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
