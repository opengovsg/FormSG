import { Controller } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import { BiCheck, BiData, BiX } from 'react-icons/bi'
import { Box, FormControl, HStack, Icon, Text, VStack } from '@chakra-ui/react'
import { extend } from 'lodash'

import { MyInfoChildAttributes } from 'formsg-shared/types'

import { SINGPASS_FAQ } from '~constants/links'
import { MultiSelect } from '~components/Dropdown'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'
import { Toggle } from '~components/Toggle/Toggle'

import { CREATE_MYINFO_CHILDREN_SUBFIELDS_OPTIONS } from '~features/admin-form/create/builder-and-design/constants'

import { CreatePageDrawerContentContainer } from '../../../../../common'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'
import { extendWithMyInfo } from '../EditMyInfo/utils'

import { ChildrenCompoundFieldMyInfo } from '.'

const VerifiedIcon = ({ isVerified }: { isVerified: boolean }): JSX.Element => {
  return (
    <Icon
      fontSize="1.5rem"
      as={isVerified ? BiCheck : BiX}
      color={isVerified ? 'success.500' : 'danger.500'}
    />
  )
}

const EDIT_MYINFO_CHILDREN = ['allowMultiple', 'childrenSubFields'] as const

type EditMyInfoChildrenProps = EditFieldProps<ChildrenCompoundFieldMyInfo>
type EditMyInfoChildrenInputs = Pick<
  ChildrenCompoundFieldMyInfo,
  (typeof EDIT_MYINFO_CHILDREN)[number]
>

export const EditMyInfoChildren = ({
  field,
}: EditMyInfoChildrenProps): JSX.Element => {
  const { t } = useTranslation()
  const extendedField = extendWithMyInfo(field)
  const {
    control,
    register,
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditMyInfoChildrenInputs, ChildrenCompoundFieldMyInfo>({
    field,
    transform: {
      // MyInfo fields are not editable (except for Child compound field),
      // so omit any transformation and output the original field
      input: (inputField) => inputField,
      output: (formOutput, originalField) =>
        extend({}, originalField, formOutput),
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
          {t(
            'features.adminForm.sidebar.fields.myInfoPreview.children.collectChildData',
          )}
        </Text>
        <Box alignSelf="stretch">
          <Controller
            control={control}
            name="childrenSubFields"
            render={({ field: { value, onChange, ...rest } }) => (
              <MultiSelect
                items={CREATE_MYINFO_CHILDREN_SUBFIELDS_OPTIONS}
                values={
                  (value ?? [MyInfoChildAttributes.ChildName]) as string[]
                }
                // Always insert name
                onChange={(val) =>
                  onChange([
                    MyInfoChildAttributes.ChildName,
                    ...val.filter(
                      (val) => val !== MyInfoChildAttributes.ChildName,
                    ),
                  ])
                }
                {...rest}
              />
            )}
          />
        </Box>
      </VStack>
      <VStack align="flex-start">
        <FormControl isReadOnly={isLoading}>
          <Toggle
            {...register('allowMultiple')}
            label={t(
              'features.adminForm.sidebar.fields.myInfoPreview.children.allowMultiple',
            )}
          />
        </FormControl>
      </VStack>
      <VStack align="flex-start">
        <Text textStyle="subhead-1">
          {t('features.adminForm.sidebar.fields.myInfoPreview.fieldDetails')}
        </Text>
        <Text>{extendedField.details}</Text>
      </VStack>
      <FormFieldDrawerActions
        isLoading={isLoading}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </CreatePageDrawerContentContainer>
  )
}
