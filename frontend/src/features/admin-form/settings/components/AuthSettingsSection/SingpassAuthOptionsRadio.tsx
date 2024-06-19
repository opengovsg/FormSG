import {
  Fragment,
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { Box, Flex, Spacer } from '@chakra-ui/react'

import { FormAuthType, FormSettings, FormStatus } from '~shared/types'

import Radio from '~components/Radio'
import { Tag } from '~components/Tag'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useMutateFormSettings } from '../../mutations'

import { FORM_SINGPASS_AUTHTYPES } from './constants'
import { EsrvcIdBox } from './EsrvcIdBox'

export interface SingpassAuthOptionsRadioProps {
  settings: FormSettings
  isDisabled: boolean
}

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

const radioOptions: [FormAuthType, string][] = Object.entries(
  FORM_SINGPASS_AUTHTYPES,
) as [FormAuthType, string][]

export const SingpassAuthOptionsRadio = ({
  settings,
  isDisabled,
}: SingpassAuthOptionsRadioProps): JSX.Element => {
  const { mutateFormAuthType } = useMutateFormSettings()
  const [focusedValue, setFocusedValue] = useState<FormAuthType>()

  const isFormPublic = useMemo(
    () => settings.status === FormStatus.Public,
    [settings],
  )

  const isEsrvcIdBoxDisabled = useMemo(
    () => isFormPublic || mutateFormAuthType.isLoading,
    [isFormPublic, mutateFormAuthType.isLoading],
  )

  const checkIsDisabled = useCallback(() => {
    return isDisabled || mutateFormAuthType.isLoading
  }, [isDisabled, mutateFormAuthType.isLoading])

  const handleEnterKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (
        (e.key === 'Enter' || e.key === ' ') &&
        focusedValue &&
        !checkIsDisabled() &&
        focusedValue !== settings.authType
      ) {
        return mutateFormAuthType.mutate(focusedValue)
      }
    },
    [focusedValue, checkIsDisabled, mutateFormAuthType, settings.authType],
  )

  const handleOptionClick = useCallback(
    (authType: FormAuthType): MouseEventHandler =>
      (e) => {
        if (
          !checkIsDisabled() &&
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
    [mutateFormAuthType, settings.authType, checkIsDisabled],
  )

  return (
    <Radio.RadioGroup
      value={settings.authType}
      onKeyDown={handleEnterKeyDown}
      onChange={(e: FormAuthType) => setFocusedValue(e)}
    >
      {radioOptions.map(([authType, text]) => (
        <Fragment key={authType}>
          <Box onClick={handleOptionClick(authType)}>
            <Radio value={authType} isDisabled={checkIsDisabled()}>
              <Flex>
                {text}
                {authType === FormAuthType.SGID ||
                authType === FormAuthType.SGID_MyInfo ? (
                  <>
                    <Spacer w="16px" />
                    <Tag size="sm" variant="subtle">
                      Free
                    </Tag>
                  </>
                ) : null}
              </Flex>
            </Radio>
          </Box>
          {esrvcidRequired(authType) && authType === settings.authType ? (
            <EsrvcIdBox settings={settings} isDisabled={isEsrvcIdBoxDisabled} />
          ) : null}
        </Fragment>
      ))}
    </Radio.RadioGroup>
  )
}
