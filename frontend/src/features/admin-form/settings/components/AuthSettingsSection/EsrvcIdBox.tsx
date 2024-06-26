import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import {
  Flex,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  Stack,
  VisuallyHidden,
} from '@chakra-ui/react'

import { FormAuthType, FormSettings } from '~shared/types/form'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Input from '~components/Input'
import Spinner from '~components/Spinner'

import { useMutateFormSettings } from '../../mutations'

import { EsrvcHelperText } from './EsrvcHelperText'

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
        <EsrvcHelperText authType={settings.authType} />
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
