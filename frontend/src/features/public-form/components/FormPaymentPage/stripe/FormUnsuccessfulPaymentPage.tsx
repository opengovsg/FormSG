import { useMemo } from 'react'
import { Box, Button, Flex, Link, Stack, Text } from '@chakra-ui/react'

import { FormFooter } from '../../FormFooter'
import { PaymentStack } from '../components'
import { PaymentCanceledSvgr } from '../components/assets/PaymentCanceledSvgr'

interface FormUnsuccessfulPaymentProps {
  title: string
  message?: string
  formId: string
}

export const FormUnsuccessfulPayment = ({
  title,
  message,
  formId,
}: FormUnsuccessfulPaymentProps): JSX.Element => {
  const shareLink = useMemo(
    () => `${window.location.origin}/${formId}`,
    [formId],
  )
  return (
    <Flex flexDir="column" h="100%">
      <Flex
        justify="center"
        flexDir="column"
        align="center"
        // flex={1}
        bgGradient={{
          base: 'linear(to-b, primary.500, primary.500 40%, primary.100 0)',
          md: 'linear(to-b, primary.500 50%, primary.100 50%)',
        }}
        py="3rem"
        px="1.5rem"
      >
        <PaymentCanceledSvgr
          maxW="100%"
          maxH={{ base: '220px', md: 'initial' }}
        />
        <Stack
          color="secondary.500"
          align="center"
          textAlign="center"
          mt="3.5rem"
        >
          <Box display="flex" justifyContent="center" alignItems="center">
            <Stack spacing="1rem">
              <Text textStyle="h2" textColor="secondary.500">
                {title}
              </Text>
              <Text textStyle="subhead-1" textColor="secondary.500">
                {message}
              </Text>
              <Box
                pt="1.5rem"
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <Link href={`${shareLink}`}>
                  <Button variant="outline" width="8.7rem">
                    Fill form again
                  </Button>
                </Link>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Flex>
      <Flex
        bg="primary.100"
        p={{ base: 0, md: '1.5rem' }}
        flex={0}
        justify="center"
      >
        <FormFooter />
      </Flex>
    </Flex>
  )
}
