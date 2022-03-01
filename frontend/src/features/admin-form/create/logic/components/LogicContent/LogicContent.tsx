import { useCallback } from 'react'
import { Flex, Icon, Stack, Text } from '@chakra-ui/react'

import { useAdminLogicStore } from '../../adminLogicStore'
import { ALLOWED_FIELDS_META } from '../../constants'
import { useAdminFormLogic } from '../../hooks/useAdminFormLogic'
import { AdminEditLogicState } from '../../types'

import { LogicBlock } from './LogicBlock'
import { NewLogicBlock } from './NewLogicBlock'

export const LogicContent = (): JSX.Element => {
  const isCreatingState = useAdminLogicStore(
    useCallback(
      (state) =>
        state.createOrEditData?.state === AdminEditLogicState.CreatingLogic,
      [],
    ),
  )
  const { formLogics, isLoading } = useAdminFormLogic()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Stack color="secondary.500" spacing="1rem">
      <Flex
        px={{ base: '1.5rem', md: '2rem' }}
        py={{ base: '1rem', md: '2rem' }}
        flexDir="column"
        bg="white"
      >
        <Text as="h2" textStyle="h2" mb="0.5rem">
          Logic
        </Text>
        <Text textStyle="body-1" mb="1.5rem">
          Please test your form thoroughly to ensure the logic works as
          expected.
        </Text>
        <Stack spacing="0.75rem" maxW="28rem">
          <Text textStyle="subhead-3">Allowed fields</Text>
          <Flex
            flexWrap="wrap"
            flexDir="row"
            columnGap="2.5rem"
            rowGap="0.75rem"
          >
            {ALLOWED_FIELDS_META.map(({ icon, label }) => (
              <Stack w="5rem" key={label} direction="row" align="center">
                <Icon fontSize="1rem" as={icon} />
                <Text textStyle="body-2">{label}</Text>
              </Stack>
            ))}
          </Flex>
        </Stack>
      </Flex>
      {formLogics?.map((logic) => (
        <LogicBlock key={logic._id} logic={logic} />
      ))}
      {isCreatingState ? <NewLogicBlock /> : null}
    </Stack>
  )
}
