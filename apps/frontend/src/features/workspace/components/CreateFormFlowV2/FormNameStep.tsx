import { RegisterOptions, UseFormReturn } from 'react-hook-form'
import { BiRightArrowAlt } from 'react-icons/bi'
import { Box, FormControl, Stack, Text } from '@chakra-ui/react'

import { useFormTitleValidationRules } from '~utils/formValidation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { CreateFormFlowV2Inputs } from './CreateFormFlowV2Page'

interface FormNameStepProps {
  formMethods: UseFormReturn<CreateFormFlowV2Inputs>
  onSubmit: () => void
  onCancel: () => void
  isLoading: boolean
}

export const FormNameStep = ({
  formMethods,
  onSubmit,
  onCancel,
  isLoading,
}: FormNameStepProps): JSX.Element => {
  const {
    register,
    formState: { errors },
  } = formMethods

  const formTitleValidationRules = useFormTitleValidationRules()

  return (
    <Stack spacing="2rem" maxW="32rem">
      <Box>
        <Text textStyle="h2" color="secondary.700" mb="0.5rem">
          Name your form
        </Text>
        <Text textStyle="body-1" color="secondary.400">
          You can always change this later.
        </Text>
      </Box>

      <FormControl isRequired isInvalid={!!errors.title}>
        <FormLabel>Form name</FormLabel>
        <Input
          autoFocus
          placeholder="e.g. Leave Application Form"
          {...register(
            'title',
            formTitleValidationRules as RegisterOptions<
              CreateFormFlowV2Inputs,
              'title'
            >,
          )}
        />
        <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
      </FormControl>

      <Stack spacing="0.75rem">
        <Button
          rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
          onClick={onSubmit}
          isLoading={isLoading}
        >
          Next step
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  )
}
