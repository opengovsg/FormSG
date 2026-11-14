import {
  Fragment,
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Box, FormLabel } from '@chakra-ui/react'

import { FormAuthType, FormSettings, FormStatus } from 'formsg-shared/types'

import Radio from '~components/Radio'

import { useMutateFormSettings } from '../../mutations'
import { isEsrvcidRequired } from '../utils'

import { getLoginOptions } from './constants'
import { EsrvcIdBox } from './EsrvcIdBox'
import { LoginOptionLabel } from './LoginOptionLabel'

export interface SingpassAuthOptionsRadioProps {
  settings: FormSettings
  isDisabled: boolean
}

export const SingpassAuthOptionsRadio = ({
  settings,
  isDisabled,
}: SingpassAuthOptionsRadioProps): JSX.Element => {
  const { t } = useTranslation()
  const { mutateFormAuthType } = useMutateFormSettings()
  const [focusedValue, setFocusedValue] = useState<FormAuthType>()

  const isFormPublic = settings.status === FormStatus.Public

  const isEsrvcIdBoxDisabled = isFormPublic || mutateFormAuthType.isLoading

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
    <>
      <FormLabel id="form-login-label" mb="1rem">
        {t('features.adminForm.sidebar.workflow.stepLogin.formQuestion')}
      </FormLabel>
      <Radio.RadioGroup
        aria-labelledby="form-login-label"
        style={{ opacity: isDisabled ? 0.8 : 1 }}
        value={settings.authType}
        onKeyDown={handleEnterKeyDown}
        onChange={(e: FormAuthType) => setFocusedValue(e)}
      >
        {getLoginOptions(settings.authType).map((authType) => (
          <Fragment key={authType}>
            <Box onClick={handleOptionClick(authType)}>
              <Radio
                value={authType}
                allowDeselect={false}
                isDisabled={checkIsDisabled()}
              >
                <LoginOptionLabel authType={authType} />
              </Radio>
            </Box>
            {isEsrvcidRequired(authType) && authType === settings.authType ? (
              <EsrvcIdBox
                settings={settings}
                isDisabled={isEsrvcIdBoxDisabled}
              />
            ) : null}
          </Fragment>
        ))}
      </Radio.RadioGroup>
    </>
  )
}
