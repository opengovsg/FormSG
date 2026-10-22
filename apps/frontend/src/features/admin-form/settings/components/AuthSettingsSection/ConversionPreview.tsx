import { PropsWithChildren } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, Stack, Table, Tbody, Td, Text, Tr } from '@chakra-ui/react'

import { BasicField, CorppassAttribute } from 'formsg-shared/types/field'
import {
  createLoginIdentityField,
  LOGIN_IDENTITY_LABELS,
  LOGIN_IDENTITY_LOGINS,
  LOGIN_IDENTITY_SOURCES,
  LoginIdentityAttribute,
} from 'formsg-shared/utils/login-identity'

import Link from '~components/Link'
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
  isScrollable = true,
}: {
  attrs: LoginIdentityAttribute[]
  stepNumber: number
  nextQuestionNumber?: number
  isScrollable?: boolean
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

  const outputDetails = (
    <Stack spacing="1rem">
      <Box
        bg="white"
        borderWidth="1px"
        borderColor="neutral.300"
        borderRadius="md"
        p={{ base: '1rem', md: '1.5rem' }}
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
                <Td
                  pr={0}
                  py="0.75rem"
                  color="secondary.500"
                  verticalAlign="top"
                >
                  {t(`preview.outputs.${output}.description`, {
                    fields:
                      login === 'corppass' ? 'NRIC/FIN and UEN' : 'NRIC/FIN',
                    labels: attrs
                      .map(
                        (attr) =>
                          `${output === 'csv' ? '[Myinfo] ' : ''}${LOGIN_IDENTITY_LABELS[attr]}`,
                      )
                      .join(', '),
                  })}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      <Link
        href="https://guide.form.gov.sg/faq/faq/migration-to-nric-fin-uen-field#will-my-responses-look-different-after-i-convert"
        isExternal
        alignSelf="flex-start"
      >
        {t('learnMore')}
      </Link>
    </Stack>
  )

  return (
    <Stack
      spacing="1.5rem"
      flex="0 1 auto"
      minH={0}
      overflowY={isScrollable ? 'auto' : 'visible'}
      pb="1.5rem"
      sx={{ scrollbarGutter: 'stable' }}
    >
      {stepNumber === 0 ? (
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
        </Stack>
      ) : (
        <Stack spacing="1rem">
          <Text color="secondary.500">
            {t('preview.automationWarning', {
              fields: login === 'corppass' ? 'NRIC/FIN and UEN' : 'NRIC/FIN',
            })}
          </Text>
          {outputDetails}
        </Stack>
      )}
    </Stack>
  )
}
