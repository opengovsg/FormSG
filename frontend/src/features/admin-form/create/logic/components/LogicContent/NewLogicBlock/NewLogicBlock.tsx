import { useLayoutEffect, useRef } from 'react'
import { BiPlus, BiTrash } from 'react-icons/bi'
import {
  Box,
  ButtonGroup,
  Divider,
  Flex,
  Grid,
  Stack,
  Text,
} from '@chakra-ui/react'

import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Input from '~components/Input'

import { useBuilderLogic } from '../../../BuilderLogicContext'

export const NewLogicBlock = () => {
  const { handleSetHasPendingLogic } = useBuilderLogic()

  const ref = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  return (
    <Box
      ref={ref}
      borderRadius="4px"
      bg="white"
      border="1px solid"
      borderColor="neutral.400"
      transitionProperty="common"
      transitionDuration="normal"
      _focusWithin={{
        borderColor: 'primary.500',
        boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
      }}
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
        <Text textStyle="subhead-3">IF</Text>
        <Input autoFocus />

        <Text textStyle="subhead-3">IS</Text>
        <Stack direction="row" align="center">
          <Input /> <Input />
        </Stack>

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
          <Button leftIcon={<BiPlus fontSize="1.5rem" />}>Add condition</Button>
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
            onClick={() => handleSetHasPendingLogic(false)}
          />
          <Button>Save changes</Button>
        </ButtonGroup>
      </Flex>
    </Box>
  )
}
