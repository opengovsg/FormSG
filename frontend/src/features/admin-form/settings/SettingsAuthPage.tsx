/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { Box, Skeleton } from '@chakra-ui/react'

import { FormAuthType, FormSettings, FormStatus } from '~shared/types/form/form'

import InlineMessage from '~components/InlineMessage'
import Radio from '~components/Radio'

import { CategoryHeader } from './components/CategoryHeader'
import { useMutateFormSettings } from './mutations'
import { useAdminFormSettings } from './queries'

const AUTHTYPE_TO_TEXT = {
  [FormAuthType.NIL]: 'None',
  [FormAuthType.SP]: 'Singpass',
  [FormAuthType.SGID]: 'Singpass App-only Login (Free)',
  [FormAuthType.MyInfo]: 'Singpass with MyInfo',
  [FormAuthType.CP]: 'Singpass (Corporate)',
}

const FORM_AUTH_TYPES = Object.values(FormAuthType)

export const SettingsAuthPage = (): JSX.Element => {
  const { data: settings } = useAdminFormSettings()

  const isFormPublic = useMemo(
    () => settings?.status === FormStatus.Public,
    [settings],
  )

  return (
    <>
      <CategoryHeader>Enable Singpass authentication</CategoryHeader>
      {isFormPublic ? (
        <InlineMessage mb="1.25rem">
          To change authentication method, close your form to new responses.
        </InlineMessage>
      ) : null}
      {settings ? (
        <AuthSettingsSelection settings={settings} isDisabled={isFormPublic} />
      ) : (
        <AuthSettingsSelectionSkeleton />
      )}
    </>
  )
}

const AuthSettingsSelectionSkeleton = () => {
  return (
    <Radio.RadioGroup>
      {Object.values(FormAuthType).map((authType) => (
        <Radio isDisabled key={authType}>
          <Skeleton>{AUTHTYPE_TO_TEXT[authType]}</Skeleton>
        </Radio>
      ))}
    </Radio.RadioGroup>
  )
}

interface AuthSettingsSelectionProps {
  settings: FormSettings
  isDisabled: boolean
}

const AuthSettingsSelection = ({
  settings,
  isDisabled: isDisabledFromProps,
}: AuthSettingsSelectionProps) => {
  const { mutateFormAuthType } = useMutateFormSettings()

  const [focusedValue, setFocusedValue] = useState<FormAuthType>()
  const isDisabled = useMemo(
    () => isDisabledFromProps || mutateFormAuthType.isLoading,
    [isDisabledFromProps, mutateFormAuthType.isLoading],
  )

  const handleEnterKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (!isDisabled && (e.key === 'Enter' || e.key === ' ') && focusedValue) {
        return mutateFormAuthType.mutate(focusedValue)
      }
    },
    [focusedValue, isDisabled, mutateFormAuthType],
  )

  const handleOptionClick = useCallback(
    (authType: FormAuthType): MouseEventHandler =>
      (e) => {
        if (
          !isDisabled &&
          e.type === 'click' &&
          // Required so only real clicks get registered.
          // Typical radio behaviour is that the 'click' event is triggered on change.
          // See: https://www.w3.org/TR/2012/WD-html5-20121025/content-models.html#interactive-content
          // https://github.com/facebook/react/issues/7407#issuecomment-237082712
          e.clientX !== 0 &&
          e.clientY !== 0
        ) {
          return mutateFormAuthType.mutate(authType)
        }
      },
    [isDisabled, mutateFormAuthType],
  )

  return (
    <Radio.RadioGroup
      value={settings.authType}
      onKeyDown={handleEnterKeyDown}
      onChange={(e: FormAuthType) => setFocusedValue(e)}
    >
      {FORM_AUTH_TYPES.map((authType) => (
        <Box key={authType} onClick={handleOptionClick(authType)}>
          <Radio value={authType} isDisabled={isDisabled}>
            {AUTHTYPE_TO_TEXT[authType]}
          </Radio>
        </Box>
      ))}
    </Radio.RadioGroup>
  )
}
