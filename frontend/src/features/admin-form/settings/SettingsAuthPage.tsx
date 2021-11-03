import React, {
  ChangeEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Box,
  Skeleton,
  Stack,
  Text,
  VisuallyHidden,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'

import {
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
} from '~shared/types/form'

import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Link from '~components/Link'
import Radio from '~components/Radio'

import { CategoryHeader } from './components/CategoryHeader'
import { useMutateFormSettings } from './mutations'
import { useAdminFormSettings } from './queries'

type EmailFormAuthType = FormAuthType
type StorageFormAuthType = FormAuthType.NIL | FormAuthType.SP | FormAuthType.CP

const STORAGE_MODE_AUTHTYPES: Record<StorageFormAuthType, string> = {
  [FormAuthType.NIL]: 'None',
  [FormAuthType.SP]: 'Singpass',
  [FormAuthType.CP]: 'Singpass (Corporate)',
}

// Not using STORAGE_MODE_AUTHTYPES due to wanting a different order.
const EMAIL_MODE_AUTHTYPES: Record<EmailFormAuthType, string> = {
  [FormAuthType.NIL]: 'None',
  [FormAuthType.SP]: 'Singpass',
  [FormAuthType.SGID]: 'Singpass App-only Login (Free)',
  [FormAuthType.MyInfo]: 'Singpass with MyInfo',
  [FormAuthType.CP]: 'Singpass (Corporate)',
}
const AUTHTYPE_TO_TEXT = {
  [FormResponseMode.Email]: EMAIL_MODE_AUTHTYPES,
  [FormResponseMode.Encrypt]: STORAGE_MODE_AUTHTYPES,
}

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
          !isDisabled &&
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
    <Radio.RadioGroup
      value={settings.authType}
      onKeyDown={handleEnterKeyDown}
      onChange={(e: FormAuthType) => setFocusedValue(e)}
    >
      {radioOptions.map(([authType, text]) => (
        <React.Fragment key={authType}>
          <Box onClick={handleOptionClick(authType)}>
            <Radio value={authType} isDisabled={isDisabled}>
              {text}
            </Radio>
          </Box>
          {authType !== FormAuthType.NIL && authType === settings.authType ? (
            <EsrvcIdBox settings={settings} isDisabled={isDisabled} />
          ) : null}
        </React.Fragment>
      ))}
    </Radio.RadioGroup>
  )
}

const EsrvcIdBox = ({
  settings,
  isDisabled,
}: {
  settings: FormSettings
  isDisabled: boolean
}) => {
  const initialEsrvcId = useMemo(() => settings.esrvcId ?? '', [settings])

  const [value, setValue] = useState<string>(initialEsrvcId)

  const inputRef = useRef<HTMLInputElement>(null)
  const { mutateFormEsrvcId } = useMutateFormSettings()

  const handleValueChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => setValue(e.target.value),
    [],
  )

  const handleBlur = useCallback(() => {
    if (value === initialEsrvcId) return

    return mutateFormEsrvcId.mutate(value, {
      onError: () => {
        setValue(initialEsrvcId)
      },
    })
  }, [initialEsrvcId, mutateFormEsrvcId, value])

  const handleKeydown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        inputRef.current?.blur()
      }
    },
    [],
  )

  return (
    <Stack ml="2.75rem" mb="1.25rem">
      <Text textStyle="body-2" color="secondary.400">
        Find out{' '}
        <Link
          isExternal
          href="https://guide.form.gov.sg/AdvancedGuide.html#how-do-you-enable-singpass-or-corppass"
        >
          how to get your Singpass e-service ID
        </Link>
        .
      </Text>
      <VisuallyHidden>
        <FormLabel htmlFor="esrvc-id">e-service ID:</FormLabel>
      </VisuallyHidden>
      <Wrap spacing="1rem">
        <WrapItem maxW="20rem" w="100%">
          <Input
            isDisabled={isDisabled}
            ref={inputRef}
            value={value}
            onChange={handleValueChange}
            onKeyDown={handleKeydown}
            onBlur={handleBlur}
            id="esrvc-id"
            placeholder="Enter Singpass e-service ID"
          />
        </WrapItem>
      </Wrap>
    </Stack>
  )
}
