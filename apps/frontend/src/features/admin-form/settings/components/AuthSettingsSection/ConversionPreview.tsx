import { PropsWithChildren } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Stack,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react'

import {
  BasicField,
  CorppassAttribute,
  MyInfoAttribute,
} from 'formsg-shared/types/field'
import {
  createLoginIdentityField,
  LOGIN_IDENTITY_LABELS,
  LOGIN_IDENTITY_LOGINS,
  LOGIN_IDENTITY_SOURCES,
  LoginIdentityAttribute,
} from 'formsg-shared/utils/login-identity'

import { Tab } from '~components/Tabs'
import Toggle from '~components/Toggle'
import { NricField } from '~templates/Field/Nric/NricField'
import { UenField } from '~templates/Field/Uen/UenField'

import { LOGIN_IDENTITY_PREVIEW_VALUES } from '~features/myinfo/utils'

const LEGACY_LABELS: Record<LoginIdentityAttribute, string> = {
  [MyInfoAttribute.UinFin]: 'SingPass Validated NRIC',
  [CorppassAttribute.Uid]: 'CorpPass Validated UID',
  [CorppassAttribute.Uen]: 'CorpPass Validated UEN',
}

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
  nextQuestionNumber = 1,
}: {
  attrs: LoginIdentityAttribute[]
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
    <Tabs isFitted>
      <TabList px="2px" mb="1.5rem">
        <Tab>{t('preview.before')}</Tab>
        <Tab>{t('preview.after')}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel p={0}>
          <Stack spacing="1rem">
            <Text color="secondary.500">
              {t(`${login}.currentCollectionExplanation`)}
            </Text>
            <PreviewCard label={t('preview.howYouCollect')}>
              <Text textStyle="subhead-1">{t('preview.settingsTitle')}</Text>
              <Toggle
                label={t('toggleLabel')}
                isChecked
                isReadOnly
                tabIndex={-1}
                containerStyles={{ pointerEvents: 'none' }}
              />
            </PreviewCard>
            <Text color="secondary.500">
              {t('preview.currentResponsesExplanation')}
            </Text>
            <PreviewCard label={t('preview.responseLabels')}>
              {attrs.map((attr) => (
                <Text key={attr} textStyle="subhead-1">
                  {LEGACY_LABELS[attr]}
                </Text>
              ))}
            </PreviewCard>
          </Stack>
        </TabPanel>
        <TabPanel p={0}>
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
            <Text color="secondary.500">
              {t('preview.responsesExplanation')}
            </Text>
            <PreviewCard label={t('preview.responseLabels')}>
              {attrs.map((attr) => (
                <Text key={attr} textStyle="subhead-1">
                  {LOGIN_IDENTITY_LABELS[attr]}
                </Text>
              ))}
            </PreviewCard>
            <Text color="secondary.500">{t('preview.responsesUnchanged')}</Text>
          </Stack>
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}
