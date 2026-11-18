import { Trans, useTranslation } from 'react-i18next'
import { BiCheck, BiData } from 'react-icons/bi'
import { HStack, Icon, Text, VStack } from '@chakra-ui/react'

import { CorppassAttribute, MyInfoAttribute } from 'formsg-shared/types/field'
import {
  getLoginIdentityAttr,
  LoginIdentityAttribute,
  LoginIdentityFieldBase,
} from 'formsg-shared/utils/login-identity'

import { SINGPASS_FAQ } from '~constants/links'
import Link from '~components/Link'

import {
  FieldBuilderState,
  fieldBuilderStateSelector,
  useFieldBuilderStore,
} from '~features/admin-form/create/builder-and-design/useFieldBuilderStore'
import { MyInfoDataSource } from '~features/myinfo/types'

import { CreatePageDrawerContentContainer } from '../../../../common'

import { FormFieldDrawerActions } from './common/FormFieldDrawerActions'
import { EditFieldProps } from './common/types'
import { useEditFieldForm } from './common/useEditFieldForm'

const LOGIN_IDENTITY_DATA_SOURCES: Record<LoginIdentityAttribute, string[]> = {
  [MyInfoAttribute.UinFin]: [MyInfoDataSource.ICA, MyInfoDataSource.MOM],
  [CorppassAttribute.Uen]: ['Corppass'],
  [CorppassAttribute.Uid]: ['Corppass'],
}

const VerifiedFor = ({ children }: { children: React.ReactNode }) => (
  <HStack>
    <Icon fontSize="1.5rem" as={BiCheck} color="success.500" />
    <Text>{children}</Text>
  </HStack>
)

type EditLoginIdentityProps = EditFieldProps<LoginIdentityFieldBase>

export const EditLoginIdentity = ({
  field,
}: EditLoginIdentityProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.myInfoPreview',
  })
  const { t: tIdentity } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.loginIdentity',
  })
  const fieldBuilderState = useFieldBuilderStore(fieldBuilderStateSelector)
  const attr = getLoginIdentityAttr(field) ?? MyInfoAttribute.UinFin
  // Login identity fields are not editable, so save the field as it is.
  const { buttonText, handleUpdateField, isLoading, handleCancel } =
    useEditFieldForm<Record<string, never>, LoginIdentityFieldBase>({
      field,
      transform: {
        input: () => ({}),
        output: (_, originalField) => originalField,
      },
    })

  return (
    <CreatePageDrawerContentContainer>
      <VStack align="flex-start">
        <Text textStyle="subhead-1">{t('dataSource')}</Text>
        {LOGIN_IDENTITY_DATA_SOURCES[attr].map((source) => (
          <HStack key={source} align="flex-start">
            <Icon fontSize="1.5rem" as={BiData} />
            <Text>{source}</Text>
          </HStack>
        ))}
      </VStack>
      <VStack align="flex-start">
        <Text textStyle="subhead-1">{t('verifiedFor')}</Text>
        <VerifiedFor>{t('singaporeans')}</VerifiedFor>
        <VerifiedFor>{t('permanentResidents')}</VerifiedFor>
        <VerifiedFor>
          <Trans
            t={t}
            i18nKey="foreignersWithSingpass"
            components={{
              singpassLink: <Link isExternal href={SINGPASS_FAQ} />,
            }}
          />
        </VerifiedFor>
      </VStack>
      <VStack align="flex-start">
        <Text textStyle="subhead-1">{t('fieldDetails')}</Text>
        <Text>{tIdentity(`details.${attr}`)}</Text>
      </VStack>
      {fieldBuilderState === FieldBuilderState.CreatingField && (
        <FormFieldDrawerActions
          isLoading={isLoading}
          buttonText={buttonText}
          handleClick={handleUpdateField}
          handleCancel={handleCancel}
        />
      )}
    </CreatePageDrawerContentContainer>
  )
}
