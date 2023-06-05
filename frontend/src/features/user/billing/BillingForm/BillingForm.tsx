import { useForm } from 'react-hook-form'
import {
  Container,
  FormControl,
  Skeleton,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import { GUIDE_SPCP_ESRVCID } from '~constants/links'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Link from '~components/Link'

import { BillingSvg } from './BillingSvg'

export type EsrvcIdFormInputs = {
  esrvcId: string
}

export const BillingForm = ({
  onSubmitEsrvcId,
}: {
  onSubmitEsrvcId: (inputs: EsrvcIdFormInputs) => Promise<void>
}): JSX.Element => {
  const { handleSubmit, register, formState, setError } =
    useForm<EsrvcIdFormInputs>()

  const onSubmitForm = async (inputs: EsrvcIdFormInputs) => {
    return onSubmitEsrvcId(inputs).catch((e) => {
      setError('esrvcId', { type: 'server', message: e.message })
    })
  }

  const isMobile = useBreakpointValue({ base: true, xs: true, lg: false })

  return (
    <Container p={0} maxW="42.5rem">
      <Stack spacing="2rem">
        <BillingSvg />
        <Skeleton isLoaded={true} w="fit-content">
          <Text as="h2" textStyle="h2" whiteSpace="pre-wrap">
            Bill charges
          </Text>
        </Skeleton>
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <FormControl
            isInvalid={!!formState.errors.esrvcId}
            isReadOnly={formState.isSubmitting}
            mb="2.5rem"
          >
            <FormLabel isRequired>e-service ID</FormLabel>
            <Input
              autoComplete="email"
              autoFocus
              placeholder=""
              data-testid="esrvcId"
              {...register('esrvcId', {
                required: 'Please enter an e-service ID',
              })}
            />
            {formState.errors.esrvcId && (
              <FormErrorMessage>
                {formState.errors.esrvcId.message}
              </FormErrorMessage>
            )}
          </FormControl>
          <Stack
            direction={{ base: 'column', lg: 'row' }}
            spacing={{ base: '1.5rem', lg: '2.5rem' }}
            align="center"
          >
            <Button
              isFullWidth={isMobile}
              isLoading={formState.isSubmitting}
              type="submit"
            >
              Search
            </Button>
            <Link isExternal variant="standalone" href={GUIDE_SPCP_ESRVCID}>
              What's an e-service ID?
            </Link>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
