import { useTranslation } from 'react-i18next'
import { Box, FormControl, FormLabel, Stack } from '@chakra-ui/react'

import { FormAuthType, StepLoginAuthType } from 'formsg-shared/types'

import { textStyles } from '~theme/textStyles'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Radio from '~components/Radio'
import Toggle from '~components/Toggle'

import { EsrvcHelperText } from './EsrvcHelperText'

const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin'

// Turning login on picks Singpass, as the form-level toggle does.
export const DEFAULT_STEP_LOGIN_AUTH_TYPE = FormAuthType.MyInfo

const LOGIN_OPTIONS = [
  [FormAuthType.MyInfo, `${COPY_KEY}.singpass`],
  [FormAuthType.CP, `${COPY_KEY}.corppass`],
] as const

export const hasEsrvcIdWhitespace = (esrvcId: string): boolean =>
  /\s/.test(esrvcId)

export interface StepLoginControlsProps {
  authType: FormAuthType
  esrvcId: string
  onAuthTypeChange: (authType: StepLoginAuthType) => void
  onEsrvcIdChange: (esrvcId: string) => void
  // Settings saves on blur; the editor saves with the step.
  onEsrvcIdBlur?: () => void
  isDisabled: boolean
  isLoading?: boolean
  isEsrvcIdLoading?: boolean
  // Why the controls are disabled, if any; shown above the toggle.
  notice?: string
  // Shown under the controls, e.g. a login change the step's fields block.
  errorMessage?: React.ReactNode
  // Heading-style toggle label, as in the workflow editor.
  isTitleToggle?: boolean
  idPrefix: string
}

/**
 * One step's login: an "Enable Singpass authentication" toggle, then the
 * Singpass / Corppass radio, and the e-service ID under Corppass. Mirrors
 * the form-level Settings controls so every step reads the same way.
 */
export const StepLoginControls = ({
  authType,
  esrvcId,
  onAuthTypeChange,
  onEsrvcIdChange,
  onEsrvcIdBlur,
  isDisabled,
  isLoading = false,
  isEsrvcIdLoading = false,
  notice,
  errorMessage,
  isTitleToggle = false,
  idPrefix,
}: StepLoginControlsProps): JSX.Element => {
  const { t } = useTranslation()
  const hasLogin = authType !== FormAuthType.NIL
  const isEsrvcIdInvalid = hasEsrvcIdWhitespace(esrvcId)
  const esrvcIdInputId = `${idPrefix}-esrvc-id`

  return (
    <Box>
      {notice ? <InlineMessage mb="1rem">{notice}</InlineMessage> : null}
      <Toggle
        containerStyles={{
          mb: hasLogin ? '1rem' : 0,
          opacity: isDisabled ? 0.8 : 1,
        }}
        isDisabled={isDisabled}
        isLoading={isLoading}
        isChecked={hasLogin}
        labelStyles={
          isTitleToggle ? { ...textStyles.h4, color: 'inherit' } : undefined
        }
        label={t(`${COPY_KEY}.enable`)}
        description={t(`${COPY_KEY}.enableDescription`)}
        onChange={() =>
          onAuthTypeChange(
            hasLogin ? FormAuthType.NIL : DEFAULT_STEP_LOGIN_AUTH_TYPE,
          )
        }
      />
      {hasLogin ? (
        <Radio.RadioGroup
          style={{ opacity: isDisabled ? 0.8 : 1 }}
          value={authType}
          onChange={(next: StepLoginAuthType) => onAuthTypeChange(next)}
        >
          {LOGIN_OPTIONS.map(([option, labelKey]) => (
            <Box key={option}>
              <Radio
                value={option}
                allowDeselect={false}
                isDisabled={isDisabled || isLoading}
              >
                {t(labelKey)}
              </Radio>
              {option === FormAuthType.CP && authType === FormAuthType.CP ? (
                <FormControl
                  id={esrvcIdInputId}
                  isDisabled={isDisabled}
                  isReadOnly={isEsrvcIdLoading}
                  isInvalid={isEsrvcIdInvalid}
                >
                  <Stack
                    ml="2.75rem"
                    mb="1.25rem"
                    spacing="0.5rem"
                    maxW="20rem"
                  >
                    <FormLabel mb={0}>
                      {t(`${COPY_KEY}.esrvcIdLabel`)}
                    </FormLabel>
                    <EsrvcHelperText authType={FormAuthType.CP} />
                    <Input
                      value={esrvcId}
                      placeholder={t(`${COPY_KEY}.esrvcIdPlaceholder`)}
                      onChange={(e) => onEsrvcIdChange(e.target.value)}
                      onBlur={onEsrvcIdBlur}
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
      ) : null}
      {errorMessage ? (
        <InlineMessage variant="error" mt="1rem">
          {errorMessage}
        </InlineMessage>
      ) : null}
    </Box>
  )
}
