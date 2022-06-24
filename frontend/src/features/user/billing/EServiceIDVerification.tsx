import { useCallback, useMemo } from 'react'
import { RegisterOptions, useForm } from 'react-hook-form'
import {
  Container,
  FormControl,
  FormErrorMessage,
  IconButton,
  Input,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import simplur from 'simplur'

import { useIsMobile } from '~hooks/useIsMobile'

import { useBillingContext } from './BillingContext'

const ESERVICEID_NAME = 'eServiceID'
const ESERVICEID_REGEX = /^[a-zA-Z0-9/+]+={0,2}$/

interface EServiceIDFormInputs {
  [ESERVICEID_NAME]: string
}

const useEServiceIDVerification = () => {
  const { setEServiceID, isLoading } = useBillingContext()

  const {
    formState: { errors },
    register,
    handleSubmit,
  } = useForm<EServiceIDFormInputs>()

  const eServiceIDValidationRules: RegisterOptions = useMemo(() => {
    return {
      required: 'Please enter your e-service ID',
      pattern: {
        value: ESERVICEID_REGEX,
        message: 'The e-service ID provided is invalid',
      },
      validate: (eServiceID) => {
        const isValid = true // TODO: do we need to check if this is valid?
        return isValid || 'The e-service ID provided is invalid'
      },
    }
  }, [])

  const handleVerifyEServiceID = handleSubmit(({ eServiceID }) => {
    return setEServiceID(eServiceID.trim())
  })

  return {
    isLoading,
    handleVerifyEServiceID,
    eServiceIDValidationRules,
    register,
    errors,
  }
}

export const EServiceIDVerification = (): JSX.Element => {
  const {
    isLoading,
    handleVerifyEServiceID,
    eServiceIDValidationRules,
    register,
    errors,
  } = useEServiceIDVerification()

  const isMobile = useIsMobile()

  return <></>
}

/**

  return (
    <Container p={0} maxW="42.5rem">
      <Stack spacing="2rem">
        <FormActivationSvg />
        <Skeleton isLoaded={!isLoading} w="fit-content">
          <Text as="h2" textStyle="h2" whiteSpace="pre-line">
            <Text color="primary.500" as="span">
              {responsesCount?.toLocaleString() ?? '-'}
            </Text>
            {simplur` ${[responsesCount ?? 0]}response[|s] to date`}
          </Text>
        </Skeleton>
        <form onSubmit={handleVerifyEServiceID} noValidate>
          <Input
            name="secretKeyFile"
            ref={fileUploadRef}
            type="file"
            accept="text/plain"
            onChange={handleFileSelect}
            display="none"
          />
          <FormControl isRequired isInvalid={!!errors.secretKey} mb="1rem">
            <FormLabel description="Your Secret Key was downloaded when you created your form">
              Enter or upload Secret Key
            </FormLabel>
            <Stack direction="row" spacing="0.5rem">
              <Skeleton isLoaded={!isLoading} w="100%">
                <Input
                  isDisabled={isLoading}
                  {...register(SECRET_KEY_NAME, secretKeyValidationRules)}
                />
              </Skeleton>
              <Skeleton isLoaded={!isLoading}>
                <IconButton
                  isDisabled={isLoading}
                  variant="outline"
                  aria-label="Pass secret key from file"
                  icon={<BiUpload />}
                  onClick={() => fileUploadRef.current?.click()}
                />
              </Skeleton>
            </Stack>
            <FormErrorMessage>{errors.secretKey?.message}</FormErrorMessage>
          </FormControl>
          <Stack
            spacing={{ base: '1.5rem', md: '2rem' }}
            align="center"
            direction={{ base: 'column', md: 'row' }}
            mt="2rem"
          >
            <Button isFullWidth={isMobile} isDisabled={isLoading} type="submit">
              Unlock responses
            </Button>
            <Link
              variant="standalone"
              isExternal
              href="https://go.gov.sg/secretkeyloss"
            >
              Can't find your Secret Key?
            </Link>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
*/
