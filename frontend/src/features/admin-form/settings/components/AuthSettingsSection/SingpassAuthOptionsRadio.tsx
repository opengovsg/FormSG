import {
  Fragment,
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { Box, Flex, Spacer } from '@chakra-ui/react'
import { pickBy } from 'lodash'

import { FormAuthType, FormSettings, FormStatus } from '~shared/types'

import Radio from '~components/Radio'
import { Tag } from '~components/Tag'

import { useMutateFormSettings } from '../../mutations'
import { isEsrvcidRequired } from '../utils'

import { FORM_SINGPASS_AUTHTYPES } from './constants'
import { EsrvcIdBox } from './EsrvcIdBox'

export interface SingpassAuthOptionsRadioProps {
  settings: FormSettings
  isDisabled: boolean
}

type RadioOptionsType = [FormAuthType, string][]

const COLLAPSED_FORM_SINGPASS_AUTHTYPES = pickBy(
  FORM_SINGPASS_AUTHTYPES,
  (_, key) =>
    [FormAuthType.MyInfo, FormAuthType.CP].includes(key as FormAuthType),
)

const baseRadioOptions: RadioOptionsType = Object.entries(
  COLLAPSED_FORM_SINGPASS_AUTHTYPES,
) as [FormAuthType, string][]

export const SingpassAuthOptionsRadio = ({
  settings,
  isDisabled,
}: SingpassAuthOptionsRadioProps): JSX.Element => {
  const { mutateFormAuthType } = useMutateFormSettings()
  const [focusedValue, setFocusedValue] = useState<FormAuthType>()

  const isFormPublic = settings.status === FormStatus.Public

  const isEsrvcIdBoxDisabled = isFormPublic || mutateFormAuthType.isLoading

  const checkIsDisabled = useCallback(() => {
    return isDisabled || mutateFormAuthType.isLoading
  }, [isDisabled, mutateFormAuthType.isLoading])

  const radioOptionsWithInitialChoice: RadioOptionsType = useMemo(() => {
    if (baseRadioOptions.some(([key, _]) => key === settings.authType)) {
      return baseRadioOptions
    }
    if (settings.authType === FormAuthType.NIL) {
      return baseRadioOptions
    }

    // reinsert the initial choice so that admins can see it in the list
    return [
      [settings.authType, FORM_SINGPASS_AUTHTYPES[settings.authType]],
      ...baseRadioOptions,
    ]
  }, [settings.authType])

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
      style={{ opacity: isDisabled ? 0.3 : 1 }}
      value={settings.authType}
      onKeyDown={handleEnterKeyDown}
      onChange={(e: FormAuthType) => setFocusedValue(e)}
    >
      {radioOptionsWithInitialChoice.map(([authType, text]) => (
        <Fragment key={authType}>
          <Box onClick={handleOptionClick(authType)}>
            <Radio value={authType} isDisabled={checkIsDisabled()}>
              <Flex>
                {text}
                {[
                  FormAuthType.SGID,
                  FormAuthType.SGID_MyInfo,
                  FormAuthType.MyInfo,
                ].includes(authType) ? (
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
          {isEsrvcidRequired(authType) && authType === settings.authType ? (
            <EsrvcIdBox settings={settings} isDisabled={isEsrvcIdBoxDisabled} />
          ) : null}
        </Fragment>
      ))}
    </Radio.RadioGroup>
  )
}
