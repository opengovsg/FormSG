import { useTranslation } from 'react-i18next'
import { Box, FormControl, FormLabel, Stack } from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types'

import { textStyles } from '~theme/textStyles'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Radio from '~components/Radio'

import { isValidEsrvcId } from '../../utils'

import { getLoginOptionsKeepingLegacySingpass } from './constants'
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
  disabledReason?: string
  isHeading?: boolean
  hideQuestion?: boolean
  idPrefix: string
  commitOnActivation?: boolean
  onEsrvcIdCommit?: () => void
}

export const StepLoginControls = ({
  authType,
  savedAuthType,
  esrvcId,
  onAuthTypeChange,
  onEsrvcIdChange,
  isDisabled,
  isLoading = false,
  disabledReason,
  isHeading = false,
  hideQuestion = false,
  idPrefix,
  commitOnActivation = false,
  onEsrvcIdCommit,
}: StepLoginControlsProps): JSX.Element => {
  const { t } = useTranslation()
  const isEsrvcIdInvalid = !isValidEsrvcId(esrvcId)
  const esrvcIdInputId = `${idPrefix}-esrvc-id`

  return (
    <Box>
      {disabledReason ? (
        <InlineMessage mb="1rem">{disabledReason}</InlineMessage>
      ) : null}
      {hideQuestion ? null : (
        <FormLabel
          id={`${idPrefix}-login-label`}
          mb="1rem"
          style={isHeading ? textStyles.h4 : undefined}
        >
          {t(`${COPY_KEY}.stepQuestion`)}
        </FormLabel>
      )}
      <Radio.RadioGroup
        style={{ opacity: isDisabled ? 0.8 : 1 }}
        aria-label={
          hideQuestion ? t(`${COPY_KEY}.workflowQuestion`) : undefined
        }
        aria-labelledby={hideQuestion ? undefined : `${idPrefix}-login-label`}
        value={authType}
        onChange={(next: FormAuthType) => onAuthTypeChange(next)}
        onKeyDownCapture={
          commitOnActivation
            ? (event) => {
                if (
                  !['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(
                    event.key,
                  )
                )
                  return
                const target = event.target as HTMLInputElement
                if (target.type !== 'radio') return
                event.preventDefault()
                event.stopPropagation()
                const radios = Array.from(
                  event.currentTarget.querySelectorAll<HTMLInputElement>(
                    'input[type="radio"]:not(:disabled)',
                  ),
                )
                const current = radios.indexOf(target)
                if (current < 0 || !radios.length) return
                const direction =
                  event.key === 'ArrowDown' || event.key === 'ArrowRight'
                    ? 1
                    : -1
                radios[
                  (current + direction + radios.length) % radios.length
                ].focus()
              }
            : undefined
        }
        onKeyDown={
          commitOnActivation
            ? (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                const target = event.target as HTMLInputElement
                if (target.type !== 'radio' || isDisabled || isLoading) return
                event.preventDefault()
                onAuthTypeChange(target.value as FormAuthType)
              }
            : undefined
        }
      >
        {getLoginOptionsKeepingLegacySingpass(savedAuthType).map((option) => (
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
                    onBlur={onEsrvcIdCommit}
                    onKeyDown={
                      onEsrvcIdCommit
                        ? (event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              onEsrvcIdCommit()
                            }
                          }
                        : undefined
                    }
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
