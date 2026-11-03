import { ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import {
  FormAuthType,
  FormResponseMode,
  FormSettings,
} from 'formsg-shared/types/form'
import { getLoginIdentityAttrsForAuthType } from 'formsg-shared/utils/login-identity'

import InlineMessage from '~components/InlineMessage'

import { FieldListTabIndex } from '~features/admin-form/create/builder-and-design/constants'

import { FormSubmitterIdCollectionToggle } from './FormNricCollectionToggle'
import { MovedToFieldsMessage } from './MovedToFieldsMessage'
import { SubmitterIdCollectionSetting } from './SubmitterIdCollectionSetting'

interface SubmitterIdCollectionSectionProps {
  settings: FormSettings
  isFormPublic: boolean
  hasIdentityFields: boolean
  nextQuestionNumber?: number
  authType?: FormAuthType
  divider: ReactNode
  onGoToFields?: (tab: FieldListTabIndex) => void
}

/**
 * The "Collect NRIC/FIN/UENs" setting for Step 1's login: the legacy toggle
 * with its Convert action, or, once converted, a locked toggle pointing to
 * the identity fields.
 */
export const SubmitterIdCollectionSection = ({
  settings,
  isFormPublic,
  hasIdentityFields,
  nextQuestionNumber,
  authType = settings.authType,
  divider,
  onGoToFields,
}: SubmitterIdCollectionSectionProps): JSX.Element | null => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.singpass.submitterIdCollection',
  })
  const isNricFieldEnabled = useFeatureIsOn(featureFlags.isNricFieldEnabled)
  const isEncryptOrMultirespondentMode =
    settings.responseMode === FormResponseMode.Encrypt ||
    settings.responseMode === FormResponseMode.Multirespondent
  // Unconverted forms keep the legacy toggle until the flag enables identity fields.
  const usesIdentityFields =
    isEncryptOrMultirespondentMode &&
    !settings.isSubmitterIdCollectionEnabled &&
    isNricFieldEnabled
  const isToggleLockedByIdentityFields =
    !settings.isSubmitterIdCollectionEnabled && hasIdentityFields
  // SP login (legacy) fills no identity fields, so there is nothing to point to.
  const offersIdentityFields =
    getLoginIdentityAttrsForAuthType(authType).length > 0

  const fieldsActionRef = useRef<HTMLAnchorElement>(null)
  const [shouldFocusFields, setShouldFocusFields] = useState(false)
  useEffect(() => {
    if (!shouldFocusFields || !usesIdentityFields) return
    const frame = requestAnimationFrame(() => {
      fieldsActionRef.current?.focus()
      setShouldFocusFields(false)
    })
    return () => cancelAnimationFrame(frame)
  }, [shouldFocusFields, usesIdentityFields])

  if (usesIdentityFields && !offersIdentityFields) return null

  return (
    <>
      {divider}
      {usesIdentityFields ? (
        <Stack spacing="1rem">
          <FormSubmitterIdCollectionToggle settings={settings} isDisabled />
          <MovedToFieldsMessage
            authType={authType}
            actionRef={fieldsActionRef}
            onGoToFields={onGoToFields}
          />
        </Stack>
      ) : isNricFieldEnabled && isEncryptOrMultirespondentMode ? (
        <SubmitterIdCollectionSetting
          settings={settings}
          isFormPublic={isFormPublic}
          nextQuestionNumber={nextQuestionNumber}
          onStoppedCollecting={() => setShouldFocusFields(true)}
        />
      ) : isToggleLockedByIdentityFields ? (
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
  )
}
