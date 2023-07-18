import {
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useMemo,
  useState,
} from 'react'
import {
  Box,
  Divider,
  Flex,
  Icon,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'

import {
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
} from '~shared/types/form'

import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import { OGP_SGID } from '~constants/links'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'
import Radio from '~components/Radio'
import Tooltip from '~components/Tooltip'

import { useAdminForm } from '~features/admin-form/common/queries'
import { isMyInfo } from '~features/myinfo/utils'

import { useMutateFormSettings } from '../../mutations'

import {
  CP_TOOLTIP,
  EMAIL_MODE_SGID_AUTHTYPES_ORDERED,
  EMAIL_MODE_SINGPASS_AUTHTYPES_ORDERED,
  NONE_AUTH_TEXT,
  STORAGE_MODE_SGID_AUTHTYPES_ORDERED,
  STORAGE_MODE_SINGPASS_AUTHTYPES_ORDERED,
} from './constants'
import { EsrvcIdBox } from './EsrvcIdBox'

const esrvcidRequired = (authType: FormAuthType) => {
  switch (authType) {
    case FormAuthType.SP:
    case FormAuthType.MyInfo:
    case FormAuthType.CP:
      return true
    default:
      return false
  }
}

interface AuthSettingsSectionProps {
  settings: FormSettings
}

const SGIDText = (): JSX.Element => {
  return (
    <>
      <Text as="h3" textStyle="h3" color="secondary.500">
        Singpass App-only
      </Text>
      <Text color="secondary.400">
        Uses Singpass app QR code to authenticate. You will receive the
        respondent's NRIC with each submission.{' '}
        <Link
          href={OGP_SGID}
          isExternal
          // Needed for link to open since there are nested onClicks
          onClickCapture={(e) => e.stopPropagation()}
        >
          Learn more
        </Link>
      </Text>
    </>
  )
}

const SingpassText = (): JSX.Element => {
  return (
    <>
      <Text as="h3" textStyle="h3" color="secondary.500">
        Singpass
      </Text>
      <Text color="secondary.400">
        You will need a Singpass e-service ID or Corppass e-service ID. For
        queries and issues, contact spcp.transoffice@accenture.com.
      </Text>
    </>
  )
}

export const AuthSettingsSectionSkeleton = (): JSX.Element => {
  const singPassOptions: [FormAuthType, string][] = useMemo(() => {
    return Object.entries(STORAGE_MODE_SINGPASS_AUTHTYPES_ORDERED) as [
      FormAuthType,
      string,
    ][]
  }, [])

  const sgIDOptions: [FormAuthType, string][] = useMemo(() => {
    return Object.entries(STORAGE_MODE_SGID_AUTHTYPES_ORDERED) as [
      FormAuthType,
      string,
    ][]
  }, [])
  return (
    <Radio.RadioGroup>
      <VStack spacing={8} align="flex-start">
        <Radio isDisabled>
          <Skeleton>{NONE_AUTH_TEXT}</Skeleton>
        </Radio>
        <Divider />
        <Box>
          <SGIDText />
          {sgIDOptions.map(([authType, textToRender]) => (
            <Radio isDisabled key={authType}>
              <Skeleton>{textToRender}</Skeleton>
            </Radio>
          ))}
        </Box>
        <Divider />
        <Box>
          <SingpassText />
          {singPassOptions.map(([authType, textToRender]) => (
            <Radio isDisabled key={authType}>
              <Skeleton>{textToRender}</Skeleton>
            </Radio>
          ))}
        </Box>
      </VStack>
    </Radio.RadioGroup>
  )
}

export const AuthSettingsSection = ({
  settings,
}: AuthSettingsSectionProps): JSX.Element => {
  const { mutateFormAuthType } = useMutateFormSettings()
  const { data: form } = useAdminForm()

  const containsMyInfoFields = useMemo(
    () => form?.form_fields.some(isMyInfo) ?? false,
    [form?.form_fields],
  )

  const [focusedValue, setFocusedValue] = useState<FormAuthType>()

  const isFormPublic = useMemo(
    () => settings.status === FormStatus.Public,
    [settings],
  )

  const isDisabled = useCallback(
    (authType: FormAuthType) =>
      isFormPublic || containsMyInfoFields || mutateFormAuthType.isLoading,
    [isFormPublic, containsMyInfoFields, mutateFormAuthType.isLoading],
  )

  const isEsrvcIdBoxDisabled = useMemo(
    () => isFormPublic || mutateFormAuthType.isLoading,
    [isFormPublic, mutateFormAuthType.isLoading],
  )

  const handleEnterKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (
        (e.key === 'Enter' || e.key === ' ') &&
        focusedValue &&
        !isDisabled(focusedValue) &&
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

  const singPassOptions: [FormAuthType, string][] = useMemo(() => {
    return Object.entries(
      settings.responseMode === FormResponseMode.Email
        ? EMAIL_MODE_SINGPASS_AUTHTYPES_ORDERED
        : STORAGE_MODE_SINGPASS_AUTHTYPES_ORDERED,
    ) as [FormAuthType, string][]
  }, [settings.responseMode])

  const sgIDOptions: [FormAuthType, string][] = useMemo(() => {
    return Object.entries(
      settings.responseMode === FormResponseMode.Email
        ? EMAIL_MODE_SGID_AUTHTYPES_ORDERED
        : STORAGE_MODE_SGID_AUTHTYPES_ORDERED,
    ) as [FormAuthType, string][]
  }, [settings.responseMode])

  return (
    <Box>
      {isFormPublic ? (
        <InlineMessage mb="1.25rem">
          To change authentication method, close your form to new responses.
        </InlineMessage>
      ) : containsMyInfoFields ? (
        <InlineMessage mb="1.25rem">
          Authentication method cannot be changed without first removing MyInfo
          fields. You can still update your e-service ID.
        </InlineMessage>
      ) : null}
      <Radio.RadioGroup
        value={settings.authType}
        onKeyDown={handleEnterKeyDown}
        onChange={(e: FormAuthType) => setFocusedValue(e)}
      >
        <VStack spacing={8} align="flex-start">
          <Box onClick={handleOptionClick(FormAuthType.NIL)}>
            <Radio
              value={FormAuthType.NIL}
              isDisabled={isDisabled(FormAuthType.NIL)}
            >
              <Flex align="center">{NONE_AUTH_TEXT}</Flex>
            </Radio>
          </Box>
          <Divider />
          <Box>
            <SGIDText />

            {sgIDOptions.map(([authTypeStr, text]) => {
              const authType = authTypeStr as FormAuthType
              return (
                <>
                  <Box key={authType} onClick={handleOptionClick(authType)}>
                    <Radio value={authType} isDisabled={isDisabled(authType)}>
                      <Flex align="center">{text}</Flex>
                    </Radio>
                  </Box>
                </>
              )
            })}
          </Box>
          <Divider />
          <Box>
            <SingpassText />

            {singPassOptions.map(([authTypeStr, text]) => {
              const authType = authTypeStr as FormAuthType
              return (
                <>
                  <Box key={authType} onClick={handleOptionClick(authType)}>
                    <Radio value={authType} isDisabled={isDisabled(authType)}>
                      <Flex align="center">
                        {text}
                        {authType === FormAuthType.CP ? (
                          <Tooltip
                            label={CP_TOOLTIP}
                            placement="top"
                            textAlign="center"
                          >
                            <Icon as={BxsHelpCircle} aria-hidden ml="0.5rem" />
                          </Tooltip>
                        ) : null}
                      </Flex>
                    </Radio>
                  </Box>
                  {esrvcidRequired(authType) &&
                  authType === settings.authType ? (
                    <EsrvcIdBox
                      settings={settings}
                      isDisabled={isEsrvcIdBoxDisabled}
                    />
                  ) : null}
                </>
              )
            })}
          </Box>
        </VStack>
      </Radio.RadioGroup>
    </Box>
  )
}
