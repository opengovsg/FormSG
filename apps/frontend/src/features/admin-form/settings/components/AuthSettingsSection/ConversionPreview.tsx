import { useEffect, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, ButtonGroup, HStack, Stack, Text } from '@chakra-ui/react'

import { BasicField } from 'formsg-shared/types/field'
import {
  createLoginIdentityField,
  LOGIN_IDENTITY_LOGINS,
  LOGIN_IDENTITY_SOURCES,
  LoginIdentityAttribute,
} from 'formsg-shared/utils/login-identity'

import Button from '~components/Button'
import Toggle from '~components/Toggle'
import { NricField } from '~templates/Field/Nric/NricField'
import { UenField } from '~templates/Field/Uen/UenField'

import { LOGIN_IDENTITY_PREVIEW_VALUES } from '~features/myinfo/utils'

export const ConversionPreview = ({
  attrs,
  nextQuestionNumber = 1,
}: {
  attrs: LoginIdentityAttribute[]
  nextQuestionNumber?: number
}) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.singpass.submitterIdCollection',
  })
  const [showAfter, setShowAfter] = useState(false)
  const previewTimer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    previewTimer.current = setTimeout(() => setShowAfter(true), 2000)
    return () => clearTimeout(previewTimer.current)
  }, [])

  const selectPreview = (after: boolean) => {
    clearTimeout(previewTimer.current)
    setShowAfter(after)
  }
  const formMethods = useForm({
    defaultValues: Object.fromEntries(
      attrs.map((attr) => [
        `conversion-preview-${attr}`,
        LOGIN_IDENTITY_PREVIEW_VALUES[attr],
      ]),
    ),
  })

  return (
    <Box borderWidth="1px" borderColor="neutral.300" borderRadius="md" p="1rem">
      <HStack justify="space-between" mb="1rem">
        <Text textStyle="subhead-2">{t('preview.title')}</Text>
        <ButtonGroup size="xs" isAttached>
          {[false, true].map((after) => (
            <Button
              key={String(after)}
              variant={showAfter === after ? 'solid' : 'outline'}
              aria-pressed={showAfter === after}
              onClick={() => selectPreview(after)}
            >
              {after ? t('preview.after') : t('preview.before')}
            </Button>
          ))}
        </ButtonGroup>
      </HStack>
      <Box aria-live="polite">
        <Stack
          key={String(showAfter)}
          spacing="1rem"
          bg="white"
          borderWidth="1px"
          borderColor="neutral.300"
          borderRadius="md"
          p={{ base: '1rem', md: '1.5rem' }}
          sx={{
            '@keyframes revealIdentityFields': {
              from: { opacity: 0, transform: 'translateY(6px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
            animation: 'revealIdentityFields 250ms ease-out',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          {showAfter ? (
            <FormProvider {...formMethods}>
              <Stack spacing="2rem">
                {attrs.map((attr, index) => {
                  const schema = {
                    ...createLoginIdentityField(attr),
                    _id: `conversion-preview-${attr}`,
                    questionNumber: nextQuestionNumber + index,
                    disabled: true,
                  }
                  const sourceBadge = LOGIN_IDENTITY_SOURCES[attr]
                  return schema.fieldType === BasicField.Uen ? (
                    <UenField
                      key={attr}
                      schema={schema}
                      sourceBadge={sourceBadge}
                      isHighContrast
                    />
                  ) : (
                    <NricField
                      key={attr}
                      schema={schema}
                      sourceBadge={sourceBadge}
                      loginBadge={LOGIN_IDENTITY_LOGINS[attr]}
                      isHighContrast
                    />
                  )
                })}
              </Stack>
            </FormProvider>
          ) : (
            <>
              <Text textStyle="subhead-1">{t('preview.settingsTitle')}</Text>
              <Toggle
                label={t('toggleLabel')}
                isChecked
                isReadOnly
                tabIndex={-1}
                containerStyles={{ pointerEvents: 'none' }}
              />
            </>
          )}
        </Stack>
      </Box>
    </Box>
  )
}
