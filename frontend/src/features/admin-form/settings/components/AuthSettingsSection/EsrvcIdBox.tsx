import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import {
  Flex,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
  VisuallyHidden,
} from '@chakra-ui/react'

import { FormAuthType, FormSettings } from '~shared/types/form'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Input from '~components/Input'
import Link from '~components/Link'
import Spinner from '~components/Spinner'

import { useMutateFormSettings } from '../../mutations'

interface EsrvcIdBoxProps {
  settings: FormSettings
  isDisabled: boolean
}

export const EsrvcIdBox = ({
  settings,
  isDisabled,
}: EsrvcIdBoxProps): JSX.Element => {
  const initialEsrvcId = useMemo(() => settings.esrvcId ?? '', [settings])

  const { mutateFormEsrvcId } = useMutateFormSettings()

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ esrvcId: string }>({
    defaultValues: {
      esrvcId: initialEsrvcId,
    },
    mode: 'onChange',
  })

  const onSubmit = handleSubmit(({ esrvcId }) => {
    if (esrvcId.trim() === initialEsrvcId) return
    return mutateFormEsrvcId.mutate(esrvcId.trim(), {
      onError: () => reset(),
      onSuccess: ({ esrvcId }) => {
        setValue('esrvcId', esrvcId ?? '')
        reset({ esrvcId })
      },
    })
  })

  const handleBlur = useCallback(() => {
    return errors.esrvcId ? reset() : onSubmit()
  }, [errors, onSubmit, reset])

  const renderHelperTextComponent = () => {
    switch (settings.authType) {
      case FormAuthType.SP:
      case FormAuthType.CP:
      case FormAuthType.MyInfo:
        return (
          <Text textStyle="body-2" color="secondary.400">
            Contact{' '}
            <Link isExternal href="https://go.gov.sg/formsg-singpass-contact">
              Singpass partner support
            </Link>{' '}
            for your e-Service ID
          </Text>
        )
      default:
        return null
    }
  }

  const placeHolder = useMemo(
    () =>
      `Enter ${
        settings.authType === FormAuthType.CP ? 'Corppass' : 'Singpass'
      } e-service ID`,
    [settings.authType],
  )
  return (
    <form onSubmit={onSubmit} onBlur={handleBlur}>
      <Stack ml="2.75rem" mb="1.25rem">
        {renderHelperTextComponent()}
        <VisuallyHidden>
          <FormLabel htmlFor="esrvcId">e-service ID:</FormLabel>
        </VisuallyHidden>
        <Flex maxW="20rem" w="100%">
          <FormControl id="esrvcId" isInvalid={!!errors.esrvcId}>
            <InputGroup>
              <InputRightElement pointerEvents="none">
                <Spinner
                  display={mutateFormEsrvcId.isLoading ? 'flex' : 'none'}
                />
              </InputRightElement>
              <Input
                {...register('esrvcId', {
                  validate: {
                    noWhitespace: (value) =>
                      !value.trim().match(/\s/) ||
                      'e-service ID must not contain whitespace',
                  },
                })}
                isDisabled={isDisabled}
                isReadOnly={mutateFormEsrvcId.isLoading}
                placeholder={placeHolder}
              />
            </InputGroup>
            <FormErrorMessage>{errors.esrvcId?.message}</FormErrorMessage>
          </FormControl>
        </Flex>
      </Stack>
    </form>
  )
}
