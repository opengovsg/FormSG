import { PropsWithChildren } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiLinkExternal } from 'react-icons/bi'
import { Stack, Text } from '@chakra-ui/react'

import { BasicField } from 'formsg-shared/types/field'
import { FormAuthType } from 'formsg-shared/types/form'
import {
  createLoginIdentityField,
  getLoginIdentityAttrsForAuthType,
  LOGIN_IDENTITY_LOGINS,
  LOGIN_IDENTITY_SOURCES,
} from 'formsg-shared/utils/login-identity'

import { GUIDE_NRIC_FIELD_RESPONSE_CHANGES } from '~constants/links'
import Button from '~components/Button'
import { NricField } from '~templates/Field/Nric/NricField'
import { UenField } from '~templates/Field/Uen/UenField'

import { LOGIN_IDENTITY_PREVIEW_VALUES } from '~features/myinfo/utils'

const PreviewCard = ({
  label,
  children,
}: PropsWithChildren<{ label: string }>) => (
  <Stack
    spacing="1rem"
    bg="white"
    borderWidth="1px"
    borderColor="neutral.300"
    borderRadius="md"
    p={{ base: '1rem', md: '1.5rem' }}
  >
    <Text textStyle="caption-1" color="secondary.500">
      {label}
    </Text>
    {children}
  </Stack>
)

/** Step 1: the fields the switch adds to the end of the form. */
export const ConversionFieldPreview = ({
  authType,
  nextQuestionNumber = 1,
}: {
  authType: FormAuthType
  nextQuestionNumber?: number
}) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.singpass.submitterIdCollection',
  })
  const attrs = getLoginIdentityAttrsForAuthType(authType)
  const login = authType === FormAuthType.CP ? 'corppass' : 'singpass'
  const formMethods = useForm({
    defaultValues: Object.fromEntries(
      attrs.map((attr) => [
        `conversion-preview-${attr}`,
        LOGIN_IDENTITY_PREVIEW_VALUES[attr],
      ]),
    ),
  })

  return (
    <Stack spacing="1rem" pb="1.5rem">
      <Text color="secondary.500">{t(`${login}.collectionExplanation`)}</Text>
      <PreviewCard label={t('preview.howYouCollect')}>
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
      </PreviewCard>
    </Stack>
  )
}

/** Step 2: how new responses change, for admins with automations. */
export const ConversionResponseChanges = () => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.singpass.submitterIdCollection',
  })

  return (
    <Stack spacing="1rem" pb="1.5rem">
      <Text color="secondary.500">{t('preview.automationWarning')}</Text>
      <Text color="secondary.500">{t('preview.responsesUnchanged')}</Text>
      <Button
        as="a"
        href={GUIDE_NRIC_FIELD_RESPONSE_CHANGES}
        target="_blank"
        rel="noopener noreferrer"
        variant="outline"
        alignSelf="flex-start"
        rightIcon={<BiLinkExternal aria-hidden />}
      >
        {t('preview.checkFullChanges')}
      </Button>
    </Stack>
  )
}
