import { BiPlus } from 'react-icons/bi'
import {
  Box,
  Container,
  Divider,
  Flex,
  Grid,
  Icon,
  Stack,
  Text,
} from '@chakra-ui/react'

import Button from '~components/Button'
import Link from '~components/Link'

import { ALLOWED_FIELDS_META } from '../constants'

import { LogicSvgr } from './LogicSvgr'

export const EmptyLogic = (): JSX.Element => {
  return (
    <Box flex={1} bg="primary.100" p="3.75rem" overflowY="auto">
      <Container
        display="flex"
        flexDir="column"
        alignItems="center"
        maxW="42.5rem"
        justifyContent="center"
        textAlign="center"
        color="secondary.500"
      >
        <Text textStyle="h2" as="h2">
          Start creating logic for your form
        </Text>
        <Text textStyle="body-1" mt="1rem">
          Use input from questions to show fields, change email notifications,
          change Thank You pages, or to disable form submission.{' '}
          <Link
            isExternal
            href="https://guide.form.gov.sg/AdvancedGuide.html#form-logic"
          >
            Learn to work with logic
          </Link>
        </Text>
        <Button my="2.5rem" leftIcon={<BiPlus fontSize="1.5rem" />}>
          Add logic
        </Button>
        <LogicSvgr maxW="292px" />
        <Divider my="2.5rem" color="neutral.300" />
        <Stack spacing="1.5rem" textAlign="center" maxW="28rem">
          <Text textStyle="subhead-3">Allowed fields</Text>
          <Flex>
            <Grid
              columnGap={{ base: '1rem', md: '3.5rem' }}
              templateColumns={{
                base: 'repeat(2, minmax(20%, min-content))',
                md: 'repeat(3, minmax(0, min-content))',
              }}
            >
              {ALLOWED_FIELDS_META.map(({ icon, label }) => (
                <Stack key={label} direction="row" align="center">
                  <Icon fontSize="1rem" as={icon} />
                  <Text textStyle="body-1">{label}</Text>
                </Stack>
              ))}
            </Grid>
          </Flex>
        </Stack>
      </Container>
    </Box>
  )
}
