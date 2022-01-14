import { useEffect } from 'react'
import { Flex, Stack } from '@chakra-ui/react'

import { useAdminForm } from '~features/admin-form/common/queries'

import { FieldRowContainer } from './FieldRow/FieldRowContainer'
import { clearActiveFieldSelector, useEditFieldStore } from './editFieldStore'

export const BuilderContent = (): JSX.Element => {
  const clearActiveField = useEditFieldStore(clearActiveFieldSelector)

  useEffect(() => {
    // Clear field on component unmount.
    return () => clearActiveField()
  }, [clearActiveField])

  return (
    <Flex flex={1} bg="neutral.200">
      <Flex
        m="2rem"
        mb={0}
        flex={1}
        bg="primary.100"
        p="2.5rem"
        justify="center"
        overflow="auto"
      >
        <Flex
          h="fit-content"
          bg="white"
          p="2.5rem"
          maxW="57rem"
          w="100%"
          flexDir="column"
        >
          <Stack spacing="2.25rem">
            <BuilderFields />
          </Stack>
        </Flex>
      </Flex>
    </Flex>
  )
}

export const BuilderFields = () => {
  const { data, isLoading } = useAdminForm()

  if (!data || isLoading) {
    return <div>Loading...</div>
  }

  return (
    <>
      {data.form_fields.map((f) => (
        <FieldRowContainer key={f._id} field={f} />
      ))}
    </>
  )
}
