import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import ReactMarkdown from 'react-markdown'
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

import { useMdComponents } from '~hooks/useMdComponents'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Input from '~components/Input'
import Spinner from '~components/Spinner'

import { useMutateFormSettings } from '../../mutations'

const SPCP_GUIDE_LINK =
  'https://guide.form.gov.sg/AdvancedGuide.html#how-do-you-enable-singpass-or-corppass'

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

  const mdComponents = useMdComponents({
    styles: {
      text: {
        textStyle: 'body-2',
        color: 'secondary.400',
      },
    },
  })

  const onSubmit = handleSubmit(({ esrvcId }) => {
    if (esrvcId.trim() === initialEsrvcId) return
    return mutateFormEsrvcId.mutate(esrvcId.trim(), {
      onError: () => reset(),
      onSuccess: ({ esrvcId }) => setValue('esrvcId', esrvcId ?? ''),
    })
  })

  const handleBlur = useCallback(() => {
    return errors.esrvcId ? reset() : onSubmit()
  }, [errors, onSubmit, reset])

  const renderedHelperText = useMemo(() => {
    switch (settings.authType) {
      case FormAuthType.SP:
        return `Find out [how to get your Singpass e-service ID](${SPCP_GUIDE_LINK}).`
      case FormAuthType.CP:
        return `Corppass now uses Singpass to authenticate corporate users. You will still need a separate **Corppass e-service ID**. Find out [how to get your Corppass e-service ID](${SPCP_GUIDE_LINK}).`
      default:
        return ''
    }
  }, [settings.authType])

  return (
    <form onSubmit={onSubmit} onBlur={handleBlur}>
      <Stack ml="2.75rem" mb="1.25rem">
        <ReactMarkdown components={mdComponents}>
          {renderedHelperText}
        </ReactMarkdown>
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
                placeholder="Enter Singpass e-service ID"
              />
            </InputGroup>
            <FormErrorMessage>{errors.esrvcId?.message}</FormErrorMessage>
          </FormControl>
        </Flex>
      </Stack>
    </form>
  )
}
