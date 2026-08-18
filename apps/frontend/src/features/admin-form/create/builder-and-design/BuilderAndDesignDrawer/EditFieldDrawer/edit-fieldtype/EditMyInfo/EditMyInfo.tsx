import { Trans, useTranslation } from 'react-i18next'
import { BiCheck, BiData, BiX } from 'react-icons/bi'
import { HStack, Icon, Text, VStack } from '@chakra-ui/react'

import { MyInfoField } from 'formsg-shared/types'

import { SINGPASS_FAQ } from '~constants/links'
import Link from '~components/Link'

import {
  FieldBuilderState,
  fieldBuilderStateSelector,
  useFieldBuilderStore,
} from '~features/admin-form/create/builder-and-design/useFieldBuilderStore'

import { CreatePageDrawerContentContainer } from '../../../../../common'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

import { extendWithMyInfo } from './utils'

const VerifiedIcon = ({ isVerified }: { isVerified: boolean }): JSX.Element => {
  return (
    <Icon
      fontSize="1.5rem"
      as={isVerified ? BiCheck : BiX}
      color={isVerified ? 'success.500' : 'danger.500'}
    />
  )
}

type EditMyInfoProps = EditFieldProps<MyInfoField>

export const EditMyInfo = ({ field }: EditMyInfoProps): JSX.Element => {
  const { t } = useTranslation()
  const extendedField = extendWithMyInfo(field)
  const fieldBuilderState = useFieldBuilderStore(fieldBuilderStateSelector)
  const { buttonText, handleUpdateField, isLoading, handleCancel } =
    useEditFieldForm<EditMyInfoProps, MyInfoField>({
      field,
      transform: {
        // MyInfo fields are not editable, so omit any transformation and output the original field
        input: () => ({}),
        output: (_, originalField) => originalField,
      },
    })

  return (
    <CreatePageDrawerContentContainer>
      <VStack align="flex-start">
        <Text textStyle="subhead-1">
          {t('features.adminForm.sidebar.fields.myInfoPreview.dataSource')}
        </Text>
        {extendedField.dataSource.map((dataSource, idx) => (
          <HStack key={idx} align="flex-start">
            <Icon fontSize="1.5rem" as={BiData}></Icon>
            <Text>{dataSource}</Text>
          </HStack>
        ))}
      </VStack>
      <VStack align="flex-start">
        <Text textStyle="subhead-1">
          {t('features.adminForm.sidebar.fields.myInfoPreview.verifiedFor')}
        </Text>
        {/* NOTE: Not creating an array from the keys then enumerating because order has to be enforced in UI.
         *  This allows the object to be created with arbitrary ordered keys.
         */}
        <HStack>
          <VerifiedIcon isVerified={extendedField.verifiedFor.singaporeans} />
          <Text>
            {t('features.adminForm.sidebar.fields.myInfoPreview.singaporeans')}
          </Text>
        </HStack>
        <HStack>
          <VerifiedIcon isVerified={extendedField.verifiedFor.pr} />
          <Text>
            {t(
              'features.adminForm.sidebar.fields.myInfoPreview.permanentResidents',
            )}
          </Text>
        </HStack>
        <HStack>
          <VerifiedIcon
            isVerified={extendedField.verifiedFor.singpassforeigners}
          />
          <Text>
            <Trans
              i18nKey="features.adminForm.sidebar.fields.myInfoPreview.foreignersWithSingpass"
              components={{ link: <Link isExternal href={SINGPASS_FAQ} /> }}
            />
          </Text>
        </HStack>
      </VStack>
      <VStack align="flex-start">
        <Text textStyle="subhead-1">
          {t('features.adminForm.sidebar.fields.myInfoPreview.fieldDetails')}
        </Text>
        <Text>{extendedField.details}</Text>
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
