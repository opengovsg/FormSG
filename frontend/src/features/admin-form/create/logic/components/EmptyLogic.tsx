import { useCallback } from 'react'
import { BiPlus } from 'react-icons/bi'
import {
  Divider,
  Flex,
  Grid,
  Icon,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'

import { GUIDE_FORM_LOGIC } from '~constants/links'
import Button from '~components/Button'
import Link from '~components/Link'

import { useAdminLogicStore } from '../adminLogicStore'
import { ALLOWED_FIELDS_META } from '../constants'

import { LogicSvgr } from './LogicSvgr'

interface EmptyLogicProps {
  isLoaded: boolean
}

export const EmptyLogic = ({ isLoaded }: EmptyLogicProps): JSX.Element => {
  const setToCreating = useAdminLogicStore(
    useCallback((state) => state.setToCreating, []),
  )

  return (
    <Flex
      textAlign="center"
      flexDir="column"
      align="center"
      color="secondary.500"
      pt={{ base: '0.5rem', md: '2.75rem' }}
    >
      <Skeleton isLoaded={isLoaded}>
        <Text textStyle="h2" as="h2">
          Start creating logic for your form
        </Text>
      </Skeleton>
      <Skeleton isLoaded={isLoaded}>
        <Text textStyle="body-1" mt="1rem">
          Show or hide fields depending on user input, or disable form
          submission for invalid answers.{' '}
          <Link isExternal href={GUIDE_FORM_LOGIC}>
            Learn to work with logic
          </Link>
        </Text>
      </Skeleton>
      <Skeleton my="2.5rem" isLoaded={isLoaded}>
        <Button leftIcon={<BiPlus fontSize="1.5rem" />} onClick={setToCreating}>
          Add logic
        </Button>
      </Skeleton>
      {isLoaded ? <LogicSvgr maxW="292px" /> : <Skeleton h="230px" w="292px" />}
      <Skeleton my="2.5rem" isLoaded={isLoaded}>
        <Divider />
      </Skeleton>
      <Stack spacing="1.5rem" textAlign="center" maxW="28rem">
        <Skeleton isLoaded={isLoaded}>
          <Text textStyle="subhead-3">Allowed fields</Text>
        </Skeleton>
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
              <Skeleton isLoaded={isLoaded}>
                <Stack key={label} direction="row" align="center">
                  <Icon fontSize="1rem" as={icon} />
                  <Text textStyle="body-2">{label}</Text>
                </Stack>
              </Skeleton>
            ))}
          </Grid>
        </Flex>
      </Stack>
    </Flex>
  )
}
