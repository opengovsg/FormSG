import { BiCheck, BiData, BiX } from 'react-icons/bi'
import { Box, HStack, Icon, Text, VStack } from '@chakra-ui/react'
import { identity } from 'lodash'

import { MyInfoField } from '~shared/types'
import { extendWithMyInfo } from '~shared/types/field/myinfo'

import Link from '~components/Link'

import { DrawerContentContainer } from '../common/DrawerContentContainer'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { useEditFieldForm } from '../common/useEditFieldForm'

const VerifiedIcon = ({ isVerified }: { isVerified: boolean }): JSX.Element => {
  return (
    <Icon
      fontSize="1.5rem"
      as={isVerified ? BiCheck : BiX}
      color={isVerified ? 'success.500' : 'danger.500'}
    />
  )
}

interface EditMyInfoProps {
  field: MyInfoField
}
export const EditMyInfo = ({ field }: EditMyInfoProps): JSX.Element => {
  const extendedField = extendWithMyInfo(field)
  const {
    isSaveEnabled,
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditMyInfoProps, MyInfoField>({
    field,
    transform: {
      input: identity,
      output: (_, originalField) => originalField,
    },
  })

  return (
    <DrawerContentContainer>
      <VStack align="flex-start">
        <Text textStyle="subhead-1">Data Source</Text>
        {extendedField.dataSource.map((dataSource) => (
          <HStack>
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
            <Link isExternal href="https://www.google.com">
              Singpass
            </Link>
          </Text>
        </HStack>
      </VStack>
      <VStack align="flex-start">
        <Text textStyle="subhead-1">Field details</Text>
        <Text>{extendedField.details}</Text>
      </VStack>
      {/* NOTE: Drawer content container adds a divider between elements
       * Hence, an empty div is added to render a divider after the last child
       */}
      <FormFieldDrawerActions
        isLoading={isLoading}
        isSaveEnabled={isSaveEnabled}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
      <Box display="none" />
    </DrawerContentContainer>
  )
}
