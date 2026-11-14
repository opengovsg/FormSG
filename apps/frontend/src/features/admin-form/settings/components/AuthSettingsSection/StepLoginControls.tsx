import { useTranslation } from 'react-i18next'
import { Box, FormControl, FormLabel, Stack } from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types'

import { textStyles } from '~theme/textStyles'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Radio from '~components/Radio'

import { isValidEsrvcId } from '../../utils'

import { getLoginOptions } from './constants'
import { EsrvcHelperText } from './EsrvcHelperText'
import { LoginOptionLabel } from './LoginOptionLabel'

const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin'

export interface StepLoginControlsProps {
  authType: FormAuthType
  savedAuthType: FormAuthType
  esrvcId: string
  onAuthTypeChange: (authType: FormAuthType) => void
  onEsrvcIdChange: (esrvcId: string) => void
  isDisabled: boolean
  isLoading?: boolean
  // Why the controls are disabled, if any.
  notice?: string
  // Heading styling used by the workflow editor.
  isTitleToggle?: boolean
  idPrefix: string
}

export const StepLoginControls = ({
  authType,
  savedAuthType,
  esrvcId,
  onAuthTypeChange,
  onEsrvcIdChange,
  isDisabled,
  isLoading = false,
  notice,
  isTitleToggle = false,
  idPrefix,
}: StepLoginControlsProps): JSX.Element => {
  const { t } = useTranslation()
  const isEsrvcIdInvalid = !isValidEsrvcId(esrvcId)
  const esrvcIdInputId = `${idPrefix}-esrvc-id`

  return (
    <Box>
      {notice ? <InlineMessage mb="1rem">{notice}</InlineMessage> : null}
      <FormLabel
        id={`${idPrefix}-login-label`}
        mb="1rem"
        {...(isTitleToggle ? textStyles.h4 : {})}
      >
        {t(`${COPY_KEY}.stepQuestion`)}
      </FormLabel>
      <Radio.RadioGroup
        style={{ opacity: isDisabled ? 0.8 : 1 }}
        aria-labelledby={`${idPrefix}-login-label`}
        value={authType}
        onChange={(next: FormAuthType) => onAuthTypeChange(next)}
      >
        {getLoginOptions(savedAuthType).map((option) => (
          <Box key={option}>
            <Radio
              value={option}
              allowDeselect={false}
              isDisabled={isDisabled || isLoading}
            >
              <LoginOptionLabel authType={option} />
            </Radio>
            {option === FormAuthType.CP && authType === FormAuthType.CP ? (
              <FormControl
                id={esrvcIdInputId}
                isDisabled={isDisabled || isLoading}
                isInvalid={isEsrvcIdInvalid}
              >
                <Stack ml="2.75rem" mt="0.75rem" mb="1.25rem" spacing="0.5rem">
                  <FormLabel mb={0}>{t(`${COPY_KEY}.esrvcIdLabel`)}</FormLabel>
                  <EsrvcHelperText authType={FormAuthType.CP} />
                  <Input
                    maxW="20rem"
                    value={esrvcId}
                    placeholder={t(`${COPY_KEY}.esrvcIdPlaceholder`)}
                    onChange={(e) => onEsrvcIdChange(e.target.value)}
                  />
                  <FormErrorMessage>
                    {t(`${COPY_KEY}.esrvcIdWhitespace`)}
                  </FormErrorMessage>
                </Stack>
              </FormControl>
            ) : null}
          </Box>
        ))}
      </Radio.RadioGroup>
    </Box>
  )
}
