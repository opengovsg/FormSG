import { PropsWithChildren } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Stack,
  Table,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tbody,
  Td,
  Text,
  Tr,
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

import Link from '~components/Link'
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

  const renderOutputTable = (after: boolean) => (
    <PreviewCard
      label={t(after ? 'preview.outputChanges' : 'preview.outputDetails')}
    >
      <Table size="sm" variant="simple" sx={{ td: { whiteSpace: 'normal' } }}>
        <Tbody>
          {(['csv', 'emailJson', 'webhooks'] as const).map((output) => (
            <Tr key={output} _last={{ '& > *': { borderBottom: 0 } }}>
              <Td
                as="th"
                scope="row"
                width="30%"
                pl={0}
                py="0.75rem"
                verticalAlign="top"
                textStyle="subhead-1"
              >
                {t(`preview.outputs.${output}.label`)}
              </Td>
              <Td pr={0} py="0.75rem" color="secondary.500" verticalAlign="top">
                {t(
                  `preview.outputs.${output}.${after ? 'description' : 'beforeDescription'}`,
                  {
                    fields:
                      login === 'corppass' ? 'NRIC/FIN and UEN' : 'NRIC/FIN',
                    labels: attrs
                      .map((attr) =>
                        after
                          ? `[Myinfo] ${LOGIN_IDENTITY_LABELS[attr]}`
                          : LEGACY_LABELS[attr],
                      )
                      .join(', '),
                  },
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {after && (
        <Link
          href="https://guide.form.gov.sg/faq/faq/migration-to-nric-fin-uen-field#will-my-responses-look-different-after-i-convert"
          isExternal
          alignSelf="flex-start"
        >
          {t('preview.viewExamples')}
        </Link>
      )}
    </PreviewCard>
  )

  return (
    <Tabs isFitted display="flex" flexDirection="column" flex={1} minH={0}>
      <TabList px="2px" mb="1.5rem" flexShrink={0}>
        <Tab>{t('preview.before')}</Tab>
        <Tab>{t('preview.after')}</Tab>
      </TabList>
      <TabPanels flex={1} minH={0} overflow="hidden">
        <TabPanel
          p={0}
          pb="1.5rem"
          h="100%"
          overflowY="auto"
          sx={{ scrollbarGutter: 'stable' }}
        >
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
            {renderOutputTable(false)}
          </Stack>
        </TabPanel>
        <TabPanel
          p={0}
          pb="1.5rem"
          h="100%"
          overflowY="auto"
          sx={{ scrollbarGutter: 'stable' }}
        >
          <Stack spacing="1rem">
            <Text color="secondary.500">
              {t(`${login}.collectionExplanation`)}{' '}
              {t('preview.responsesUnchanged')}
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
            {renderOutputTable(true)}
          </Stack>
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}
