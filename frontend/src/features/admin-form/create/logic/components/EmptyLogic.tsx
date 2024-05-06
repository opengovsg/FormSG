import { useCallback } from 'react'
import { BiPlus } from 'react-icons/bi'
import { Divider, Flex, Grid, Icon, Stack, Text } from '@chakra-ui/react'
import { Button, Link } from '@opengovsg/design-system-react'

import { GUIDE_FORM_LOGIC } from '~constants/links'

import { useAdminLogicStore } from '../adminLogicStore'
import { ALLOWED_FIELDS_META } from '../constants'

import { LogicSvgr } from './LogicSvgr'

export const EmptyLogic = (): JSX.Element => {
  const setToCreating = useAdminLogicStore(
    useCallback((state) => state.setToCreating, []),
  )

  return (
    <Flex
      textAlign="center"
      flexDir="column"
      align="center"
      color="brand.secondary.500"
      pt={{ base: '0.5rem', md: '2.75rem' }}
    >
      <Text textStyle="h4" as="h2">
        Start creating logic for your form
      </Text>
      <Text textStyle="body-1" mt="1rem">
        Show or hide fields depending on user input, or disable form submission
        for invalid answers.{' '}
        <Link isExternal href={GUIDE_FORM_LOGIC}>
          Learn to work with logic
        </Link>
      </Text>
      <Button
        my="2.5rem"
        leftIcon={<BiPlus fontSize="1.5rem" />}
        onClick={setToCreating}
      >
        Add logic
      </Button>
      <LogicSvgr maxW="292px" />
      <Divider my="2.5rem" />
      <Stack spacing="1.5rem" textAlign="center" maxW="28rem">
        <Text textStyle="subhead-3">Allowed fields</Text>
        <Flex>
          <Grid
            columnGap="3.5rem"
            rowGap="1rem"
            templateColumns={{
              base: 'repeat(2, minmax(20%, min-content))',
              md: 'repeat(3, minmax(0, min-content))',
            }}
          >
            {ALLOWED_FIELDS_META.map(({ icon, label }) => (
              <Stack key={label} direction="row" align="center">
                <Icon fontSize="1rem" as={icon} />
                <Text textStyle="body-2">{label}</Text>
              </Stack>
            ))}
          </Grid>
        </Flex>
      </Stack>
    </Flex>
  )
}
