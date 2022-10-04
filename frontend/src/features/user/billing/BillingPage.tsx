import { useState } from 'react'
import { Container, Flex } from '@chakra-ui/react'

import { AdminNavBar } from '~/app/AdminNavBar'

import { fillHeightCss } from '~utils/fillHeightCss'

import { BillCharges } from './BillCharges'
import { BillingForm, EsrvcIdFormInputs } from './BillingForm'
import { DateRange } from './DateRange'

export const BillingPage = (): JSX.Element => {
  const todayDate = new Date()

  const todayDateRange = {
    yr: todayDate.getFullYear(),
    mth: todayDate.getMonth(),
  }

  const [esrvcId, setEsrvcId] = useState<string>()
  const [dateRange, setDateRange] = useState<DateRange>(todayDateRange)

  const onSubmitEsrvcId = async ({ esrvcId }: EsrvcIdFormInputs) =>
    setEsrvcId(esrvcId?.trim())

  return (
    <Flex direction="column" css={fillHeightCss}>
      <AdminNavBar />
      <Container
        overflowY="auto"
        px={{ base: '1.5rem', md: '1.25rem' }}
        py={{ base: '1.5rem', md: '3rem' }}
        maxW="69.5rem"
        flex={1}
        display="flex"
        flexDir="column"
        color="secondary.500"
      >
        {esrvcId ? (
          <BillCharges
            esrvcId={esrvcId}
            dateRange={dateRange}
            todayDateRange={todayDateRange}
            setDateRange={setDateRange}
            onSubmitEsrvcId={onSubmitEsrvcId}
          />
        ) : (
          <BillingForm onSubmitEsrvcId={onSubmitEsrvcId} />
        )}
      </Container>
    </Flex>
  )
}
