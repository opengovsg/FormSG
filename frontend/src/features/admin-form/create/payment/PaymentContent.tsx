import { useMemo } from 'react'
import { Box, Container, Flex, Image, Stack, Text } from '@chakra-ui/react'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useBgColor } from '~features/public-form/components/PublicFormWrapper'

import { useDesignColorTheme } from '../builder-and-design/utils/useDesignColorTheme'

import mock from './PaymentMock.png'
import { dataSelector, usePaymentStore } from './usePaymentStore'

export const PaymentContent = (): JSX.Element => {
  const { data: form } = useAdminForm()
  const paymentsFromStore = usePaymentStore(dataSelector)

  // When drawer is opened, store is populated. We always want the drawer settings
  // to be previewed, so when the store is populated, prioritize that setting.
  const payments = useMemo(
    () => (paymentsFromStore ? paymentsFromStore : form?.payments),
    [paymentsFromStore, form?.payments],
  )
  const colorTheme = useDesignColorTheme()

  const bg = useBgColor({ colorTheme })

  return (
    <Flex
      mb={0}
      flex={1}
      bg="neutral.200"
      // Using margin for margin collapse when there are inline messages above.
      mt={{ base: 0, md: '1rem' }}
      pt={{ base: 0, md: '1rem' }}
      pb={{ base: 0, md: '2rem' }}
      px={{ base: 0, md: '2rem' }}
      justify="center"
      display="flex"
    >
      <Stack
        direction="column"
        w="100%"
        h="fit-content"
        spacing={{ base: 0, md: '1.5rem' }}
        bg={bg}
      >
        <Box py={{ base: '1.5rem', md: '2.5rem' }} w="100%">
          {form && payments?.enabled ? (
            <Container p={0}>
              <Flex flexDir="column" align="center">
                <Stack
                  spacing={{ base: '1.5rem', md: '3rem' }}
                  py={{ base: '1.5rem', md: '3rem' }}
                  px={{ base: '1.5rem', md: '4rem' }}
                  bg="white"
                  w="100%"
                >
                  <Flex flexDir="column">
                    <Stack spacing="1rem">
                      <Box>
                        <Text textStyle="h3" textColor="primary.500">
                          Payment
                        </Text>
                        <Text textStyle="body-2" textColor="secondary.500">
                          This amount is inclusive of GST
                        </Text>
                      </Box>
                      <Text textStyle="body-1" textColor="secondary.700">
                        Your credit card will be charged:{' '}
                        <Text as="span" fontWeight="bold">
                          S$
                          {(payments?.payment_amount === undefined
                            ? 0
                            : Number(payments.payment_amount)
                          ).toFixed(2)}
                        </Text>
                      </Text>

                      <Image src={mock} alt="Mock payment element" />

                      <Text textColor="secondary.300">
                        Response ID: MOCK_SUBMISSION_ID
                      </Text>
                    </Stack>
                  </Flex>
                </Stack>
              </Flex>
            </Container>
          ) : (
            <></>
          )}
        </Box>
      </Stack>
    </Flex>
  )
}
