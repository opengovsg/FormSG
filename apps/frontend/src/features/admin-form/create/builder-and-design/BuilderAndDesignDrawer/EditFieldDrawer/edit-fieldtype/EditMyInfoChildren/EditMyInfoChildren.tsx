import { Controller } from 'react-hook-form'
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
import { useCreateTabForm } from '~features/admin-form/create/builder-and-design/useCreateTabForm'
import { isChildrenV2InBuilder } from '~features/myinfo/utils'

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

// New field description for children-v2 (ADR-0001). Surfaced in place of the
// MyInfo metadata details so admins see the v2 scope (sponsored children,
// below-21 only) and verification sources.
const CHILDREN_V2_FIELD_DESCRIPTION =
  "The children birth records of the respondent's children or sponsored children. Only data of children below 21 years old will be available. Vaccination status is verified by HPB. All other data is verified by ICA."

type EditMyInfoChildrenProps = EditFieldProps<ChildrenCompoundFieldMyInfo>
type EditMyInfoChildrenInputs = Pick<
  ChildrenCompoundFieldMyInfo,
  (typeof EDIT_MYINFO_CHILDREN)[number]
>

export const EditMyInfoChildren = ({
  field,
}: EditMyInfoChildrenProps): JSX.Element => {
  const extendedField = extendWithMyInfo(field)
  const { data: form } = useCreateTabForm()
  // children-v2 (ADR-0001): drop Secondary Race + Allow-Multiple and show
  // the new description. v2 applies when the field is stamped v2 OR the form is
  // Multi-respondent (v2 is the default there, stamped on save) — so the editor
  // reflects v2 immediately, not only after the field is persisted.
  const isV2 = isChildrenV2InBuilder(field, form?.responseMode)
  const subFieldOptions = isV2
    ? CREATE_MYINFO_CHILDREN_SUBFIELDS_OPTIONS.filter(
        (option) => option.value !== MyInfoChildAttributes.ChildSecondaryRace,
      )
    : CREATE_MYINFO_CHILDREN_SUBFIELDS_OPTIONS
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
        <Text textStyle="subhead-1">Data source</Text>
        {extendedField.dataSource.map((dataSource, idx) => (
          <HStack key={idx} align="flex-start">
            <Icon fontSize="1.5rem" as={BiData}></Icon>
            <Text>{dataSource}</Text>
          </HStack>
        ))}
      </VStack>
      <VStack align="flex-start">
        <Text textStyle="subhead-1">Verified for</Text>
        {/* NOTE: Not creating an array from the keys then enumerating because order has to be enforced in UI.
         *  This allows the object to be created with arbitrary ordered keys.
         */}
        <HStack>
          <VerifiedIcon isVerified={extendedField.verifiedFor.singaporeans} />
          <Text>Singaporeans</Text>
        </HStack>
        <HStack>
          <VerifiedIcon isVerified={extendedField.verifiedFor.pr} />
          <Text>Permanent Residents</Text>
        </HStack>
        <HStack>
          <VerifiedIcon
            isVerified={extendedField.verifiedFor.singpassforeigners}
          />
          <Text>
            Foreigners with{' '}
            <Link isExternal href={SINGPASS_FAQ}>
              Singpass
            </Link>
          </Text>
        </HStack>
      </VStack>
      <VStack align="flex-start">
        <Text textStyle="subhead-1">Collect the following child data</Text>
        <Box alignSelf="stretch">
          <Controller
            control={control}
            name="childrenSubFields"
            render={({ field: { value, onChange, ...rest } }) => (
              <MultiSelect
                items={subFieldOptions}
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
      {isV2 ? null : (
        <VStack align="flex-start">
          <FormControl isReadOnly={isLoading}>
            <Toggle
              {...register('allowMultiple')}
              label="Allow respondent to add multiple children"
            />
          </FormControl>
        </VStack>
      )}
      <VStack align="flex-start">
        <Text textStyle="subhead-1">Field details</Text>
        <Text>
          {isV2 ? CHILDREN_V2_FIELD_DESCRIPTION : extendedField.details}
        </Text>
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
