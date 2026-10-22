import { PropsWithChildren } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiLinkExternal } from 'react-icons/bi'
import { Stack, Text } from '@chakra-ui/react'

import { BasicField, CorppassAttribute } from 'formsg-shared/types/field'
import {
  createLoginIdentityField,
  LOGIN_IDENTITY_LOGINS,
  LOGIN_IDENTITY_SOURCES,
  LoginIdentityAttribute,
} from 'formsg-shared/utils/login-identity'

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

export const ConversionPreview = ({
  attrs,
  stepNumber,
  nextQuestionNumber = 1,
}: {
  attrs: LoginIdentityAttribute[]
  stepNumber: number
  nextQuestionNumber?: number
}) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.singpass.submitterIdCollection',
  })
  const login = attrs.includes(CorppassAttribute.Uid) ? 'corppass' : 'singpass'
  const formMethods = useForm({
    defaultValues: Object.fromEntries(
      attrs.map((attr) => [
        `conversion-preview-${attr}`,
        LOGIN_IDENTITY_PREVIEW_VALUES[attr],
      ]),
    ),
  })

  return (
    <Stack spacing="1.5rem" pb="1.5rem">
      {stepNumber === 0 ? (
        <Stack spacing="1rem">
          <Text color="secondary.500">
            {t(`${login}.collectionExplanation`)}
          </Text>
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
      ) : (
        <Stack spacing="1rem">
          <Text color="secondary.500">{t('preview.automationWarning')}</Text>
          <Text color="secondary.500">{t('preview.responsesUnchanged')}</Text>
          <Button
            as="a"
            href="https://guide.form.gov.sg/faq/faq/migration-to-nric-fin-uen-field#will-my-responses-look-different-after-i-convert"
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            alignSelf="flex-start"
            rightIcon={<BiLinkExternal aria-hidden />}
          >
            {t('preview.checkFullChanges')}
          </Button>
        </Stack>
      )}
    </Stack>
  )
}
