import { useCallback, useMemo } from 'react'
import {
  RegisterOptions,
  useForm,
  UseFormRegisterReturn,
} from 'react-hook-form'
import { BiHide, BiShow } from 'react-icons/bi'
import {
  FormControl,
  InputGroup,
  InputRightElement,
  Skeleton,
  Stack,
  useDisclosure,
} from '@chakra-ui/react'
import { useToggle } from 'rooks'

import { TwilioCredentials } from '~shared/types/twilio'

import { trimStringsInObject } from '~utils/trimStringsInObject'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import IconButton from '~components/IconButton'
import Input, { InputProps } from '~components/Input'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useMutateTwilioCreds } from '../../mutations'

import { DeleteTwilioModal } from './DeleteTwilioModal'

const TWILIO_INPUT_RULES: Record<keyof TwilioCredentials, RegisterOptions> = {
  accountSid: {
    required: 'Account SID is required',
    pattern: {
      value: /^\s*AC\S+\s*$/,
      message: 'Account SID must start with AC',
    },
  },
  apiKey: {
    required: 'API key SID is required',
    pattern: {
      value: /^\s*SK\S+\s*$/,
      message: 'API key SID must start with SK',
    },
  },
  apiSecret: {
    required: 'API key secret is required',
    validate: {
      noWhitespace: (value) =>
        !value.trim().match(/\s/) ||
        'API key secret must not contain whitespace',
    },
  },
  messagingServiceSid: {
    required: 'Messaging service SID is required',
    pattern: {
      value: /^\s*MG\S+\s*$/,
      message: 'Messaging service SID must start with MG',
    },
  },
}

export const TwilioDetailsInputs = (): JSX.Element => {
  const { data: form, isLoading } = useAdminForm()

  const [isApiSecretShown, toggleIsApiSecretShown] = useToggle(false)

  const hasExistingTwilioCreds = useMemo(
    () => !!form?.msgSrvcName,
    [form?.msgSrvcName],
  )

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<TwilioCredentials>({
    mode: 'onTouched',
    defaultValues: {
      accountSid: hasExistingTwilioCreds ? '********************' : '',
      apiKey: hasExistingTwilioCreds ? '********************' : '',
      apiSecret: hasExistingTwilioCreds ? '********************' : '',
      messagingServiceSid: hasExistingTwilioCreds ? '********************' : '',
    },
  })

  const { isOpen, onOpen, onClose } = useDisclosure()

  const { mutateFormTwilioDetails } = useMutateTwilioCreds()

  const handleUpdateTwilioDetails = handleSubmit((credentials) => {
    if (!form) return
    return mutateFormTwilioDetails.mutate(trimStringsInObject(credentials), {
      onSuccess: () => reset(),
    })
  })

  const registerPropsOrDisabled = useCallback(
    (name: keyof TwilioCredentials): UseFormRegisterReturn | InputProps => {
      if (hasExistingTwilioCreds) {
        return {
          isDisabled: true,
          placeholder: '********************',
        }
      }

      return register(name, TWILIO_INPUT_RULES[name])
    },
    [hasExistingTwilioCreds, register],
  )

  const onDelete = useCallback(
    () =>
      reset({
        accountSid: '',
        apiKey: '',
        apiSecret: '',
        messagingServiceSid: '',
      }),
    [reset],
  )

  return (
    <>
      <Stack spacing="2rem">
        <FormControl
          isReadOnly={mutateFormTwilioDetails.isLoading}
          isInvalid={!!errors.accountSid}
        >
          <FormLabel isRequired>Account SID</FormLabel>
          <Skeleton isLoaded={!isLoading}>
            <Input {...registerPropsOrDisabled('accountSid')} />
          </Skeleton>
          <FormErrorMessage>{errors.accountSid?.message}</FormErrorMessage>
        </FormControl>
        <FormControl
          isReadOnly={mutateFormTwilioDetails.isLoading}
          isInvalid={!!errors.apiKey}
        >
          <FormLabel isRequired>API Key SID</FormLabel>
          <Skeleton isLoaded={!isLoading}>
            <Input {...registerPropsOrDisabled('apiKey')} />
          </Skeleton>
          <FormErrorMessage>{errors.apiKey?.message}</FormErrorMessage>
        </FormControl>
        <FormControl
          isReadOnly={mutateFormTwilioDetails.isLoading}
          isInvalid={!!errors.apiSecret}
        >
          <FormLabel isRequired>API key secret</FormLabel>
          <Skeleton isLoaded={!isLoading}>
            <InputGroup>
              <Input
                {...registerPropsOrDisabled('apiSecret')}
                type={isApiSecretShown ? 'text' : 'password'}
              />
              {!hasExistingTwilioCreds && (
                <InputRightElement>
                  <IconButton
                    colorScheme="secondary"
                    minH="auto"
                    right="2px"
                    variant="clear"
                    aria-label={`${
                      isApiSecretShown ? 'Hide' : 'Show'
                    } API key secret`}
                    icon={isApiSecretShown ? <BiHide /> : <BiShow />}
                    onClick={toggleIsApiSecretShown}
                  ></IconButton>
                </InputRightElement>
              )}
            </InputGroup>
          </Skeleton>
          <FormErrorMessage>{errors.apiSecret?.message}</FormErrorMessage>
        </FormControl>
        <FormControl
          isReadOnly={mutateFormTwilioDetails.isLoading}
          isInvalid={!!errors.messagingServiceSid}
        >
          <FormLabel isRequired>Messaging service SID</FormLabel>
          <Skeleton isLoaded={!isLoading}>
            <Input {...registerPropsOrDisabled('messagingServiceSid')} />
          </Skeleton>
          <FormErrorMessage>
            {errors.messagingServiceSid?.message}
          </FormErrorMessage>
        </FormControl>
      </Stack>
      <Skeleton isLoaded={!isLoading} mt="2.5rem" w="fit-content">
        {hasExistingTwilioCreds ? (
          <Button colorScheme="danger" onClick={onOpen}>
            Remove and re-enter credentials
          </Button>
        ) : (
          <Button
            isLoading={mutateFormTwilioDetails.isLoading}
            onClick={handleUpdateTwilioDetails}
          >
            Save credentials
          </Button>
        )}
      </Skeleton>
      <DeleteTwilioModal
        isOpen={isOpen}
        onClose={onClose}
        onDelete={onDelete}
      />
    </>
  )
}
