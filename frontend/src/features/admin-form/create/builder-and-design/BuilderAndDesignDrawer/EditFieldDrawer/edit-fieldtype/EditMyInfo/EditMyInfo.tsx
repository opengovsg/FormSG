import { BiCheck, BiData, BiX } from 'react-icons/bi'
import { Box, HStack, Icon, Text, VStack } from '@chakra-ui/react'

import { MyInfoField } from '~shared/types'

import { SINGPASS_FAQ } from '~constants/links'
import InlineMessage from '~components/InlineMessage'
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
        <Text textStyle="subhead-1">Field details</Text>
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
