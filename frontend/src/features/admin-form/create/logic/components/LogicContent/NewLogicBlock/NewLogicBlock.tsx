import { useCallback, useLayoutEffect, useRef } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { BiPlus, BiTrash } from 'react-icons/bi'
import { Box, ButtonGroup, Divider, Flex, Grid, Text } from '@chakra-ui/react'

import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Input from '~components/Input'

import { useAdminLogicStore } from '../../../adminLogicStore'
import {
  EditConditionBlock,
  EditLogicInputs,
  LOGIC_FIELD_ARRAY_NAME,
} from '../EditConditionBlock'

export const NewLogicBlock = () => {
  const setToInactive = useAdminLogicStore(
    useCallback((state) => state.setToInactive, []),
  )

  const formMethods = useForm<EditLogicInputs>({
    defaultValues: {
      [LOGIC_FIELD_ARRAY_NAME]: [{}],
    },
  })

  const { fields, append } = useFieldArray({
    control: formMethods.control,
    name: LOGIC_FIELD_ARRAY_NAME,
  })

  const ref = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  const handleCreateLogic = formMethods.handleSubmit((inputs) => {
    console.log(inputs)
  })

  return (
    <FormProvider {...formMethods}>
      <Box
        ref={ref}
        borderRadius="4px"
        bg="white"
        border="1px solid"
        borderColor="primary.500"
        boxShadow="0 0 0 1px var(--chakra-colors-primary-500)"
        transitionProperty="common"
        transitionDuration="normal"
      >
        <Grid
          gridTemplateColumns={{
            base: 'minmax(100%, 1fr)',
            md: 'max-content 1fr',
          }}
          alignItems="center"
          columnGap="2rem"
          rowGap="0.75rem"
          py="1.5rem"
          px={{ base: '1.5rem', md: '2rem' }}
          borderBottom="1px solid"
          borderColor="neutral.300"
        >
          {fields.map((field, index) => {
            return <EditConditionBlock key={field.id} index={index} />
          })}
          <Divider
            alignSelf="center"
            display={{ base: 'none', md: 'block' }}
            my="1.25rem"
            // Padding and margin to extend beyond grid gap
            mx="-2rem"
            px="2rem"
          />
          <Flex flexDir="row" align="center" spacing={0} my="1.25rem">
            <Divider
              ml="-1.5rem"
              pl="1.5rem"
              w={0}
              display={{ base: 'block', md: 'none' }}
            />
            <Button
              leftIcon={<BiPlus fontSize="1.5rem" />}
              onClick={() => append({})}
            >
              Add condition
            </Button>
            <Divider
              mr={{ base: '-1.5rem', md: '-2rem' }}
              pr={{ base: '1.5rem', md: '2rem' }}
            />
          </Flex>

          <Text textStyle="subhead-3">THEN</Text>
          <Input />

          <Text textStyle="subhead-3">SHOW</Text>
          <Input />
        </Grid>
        <Flex
          justify="flex-end"
          align="center"
          py="0.375rem"
          px={{ base: '1rem', md: '2rem' }}
        >
          <ButtonGroup spacing="1rem">
            <IconButton
              variant="clear"
              colorScheme="danger"
              aria-label="Delete logic"
              icon={<BiTrash />}
              onClick={setToInactive}
            />
            <Button onClick={handleCreateLogic}>Save changes</Button>
          </ButtonGroup>
        </Flex>
      </Box>
    </FormProvider>
  )
}
