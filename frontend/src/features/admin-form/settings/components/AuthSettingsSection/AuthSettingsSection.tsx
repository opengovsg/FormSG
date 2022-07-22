import {
  Fragment,
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { Box, Icon, Skeleton } from '@chakra-ui/react'

import { FormAuthType, FormSettings, FormStatus } from '~shared/types/form'

import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'
import Radio from '~components/Radio'
import Tooltip from '~components/Tooltip'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useMutateFormSettings } from '../../mutations'

import {
  AUTHTYPE_TO_TEXT,
  CP_TOOLTIP,
  SGID_TOOLTIP,
  STORAGE_MODE_AUTHTYPES,
} from './constants'
import { EsrvcIdBox } from './EsrvcIdBox'

interface AuthSettingsSectionProps {
  settings: FormSettings
}

export const AuthSettingsSectionSkeleton = (): JSX.Element => {
  return (
    <Radio.RadioGroup>
      {Object.entries(STORAGE_MODE_AUTHTYPES).map(
        ([authType, textToRender]) => (
          <Radio isDisabled key={authType}>
            <Skeleton>{textToRender}</Skeleton>
          </Radio>
        ),
      )}
    </Radio.RadioGroup>
  )
}

export const AuthSettingsSection = ({
  settings,
}: AuthSettingsSectionProps): JSX.Element => {
  const { mutateFormAuthType } = useMutateFormSettings()
  const { data: form } = useAdminForm()

  const [focusedValue, setFocusedValue] = useState<FormAuthType>()

  const isFormPublic = useMemo(
    () => settings.status === FormStatus.Public,
    [settings],
  )

  const isDisabled = useCallback(
    (authType: FormAuthType) =>
      isFormPublic ||
      mutateFormAuthType.isLoading ||
      (authType === FormAuthType.SGID && !form?.admin.betaFlags?.sgid),
    [form?.admin.betaFlags?.sgid, isFormPublic, mutateFormAuthType.isLoading],
  )

  const handleEnterKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (
        !isDisabled &&
        (e.key === 'Enter' || e.key === ' ') &&
        focusedValue &&
        focusedValue !== settings.authType
      ) {
        return mutateFormAuthType.mutate(focusedValue)
      }
    },
    [focusedValue, isDisabled, mutateFormAuthType, settings.authType],
  )

  const handleOptionClick = useCallback(
    (authType: FormAuthType): MouseEventHandler =>
      (e) => {
        if (
          !isDisabled(authType) &&
          e.type === 'click' &&
          // Required so only real clicks get registered.
          // Typical radio behaviour is that the 'click' event is triggered on change.
          // See: https://www.w3.org/TR/2012/WD-html5-20121025/content-models.html#interactive-content
          // https://github.com/facebook/react/issues/7407#issuecomment-237082712
          e.clientX !== 0 &&
          e.clientY !== 0 &&
          authType !== settings.authType
        ) {
          return mutateFormAuthType.mutate(authType)
        }
      },
    [isDisabled, mutateFormAuthType, settings.authType],
  )

  const radioOptions: [FormAuthType, string][] = useMemo(() => {
    return Object.entries(AUTHTYPE_TO_TEXT[settings.responseMode]) as [
      FormAuthType,
      string,
    ][]
  }, [settings.responseMode])

  return (
    <Box>
      {isFormPublic ? (
        <InlineMessage mb="1.25rem">
          To change authentication method, close your form to new responses.
        </InlineMessage>
      ) : null}
      <Radio.RadioGroup
        value={settings.authType}
        onKeyDown={handleEnterKeyDown}
        onChange={(e: FormAuthType) => setFocusedValue(e)}
      >
        {radioOptions.map(([authType, text]) => (
          <Fragment key={authType}>
            <Box onClick={handleOptionClick(authType)}>
              <Radio value={authType} isDisabled={isDisabled(authType)}>
                {text}
                {authType === FormAuthType.SGID ? (
                  <>
                    <Tooltip
                      label={SGID_TOOLTIP}
                      placement="top"
                      textAlign="center"
                    >
                      <Icon as={BxsHelpCircle} aria-hidden marginX="0.5rem" />
                    </Tooltip>
                    <Link
                      href="https://go.gov.sg/sgid-formsg"
                      isExternal
                      // Needed for link to open since there are nested onClicks
                      onClickCapture={(e) => e.stopPropagation()}
                    >
                      Contact us to find out more
                    </Link>
                  </>
                ) : null}
                {authType === FormAuthType.CP ? (
                  <Tooltip
                    label={CP_TOOLTIP}
                    placement="top"
                    textAlign="center"
                  >
                    <Icon as={BxsHelpCircle} aria-hidden ml="0.5rem" />
                  </Tooltip>
                ) : null}
              </Radio>
            </Box>
            {authType !== FormAuthType.NIL && authType === settings.authType ? (
              <EsrvcIdBox
                settings={settings}
                isDisabled={isDisabled(authType)}
              />
            ) : null}
          </Fragment>
        ))}
      </Radio.RadioGroup>
    </Box>
  )
}
