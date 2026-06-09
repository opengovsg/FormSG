import { RegisterOptions, UseFormReturn } from 'react-hook-form'
import { BiRightArrowAlt } from 'react-icons/bi'
import { Box, FormControl, Stack, Text } from '@chakra-ui/react'

import { useFormTitleValidationRules } from '~utils/formValidation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { CreateFormFlowV2Inputs } from './CreateFormFlowV2Page'

interface StorageModeNameStepProps {
  formMethods: UseFormReturn<CreateFormFlowV2Inputs>
  onSubmit: () => void
  isLoading: boolean
}

export const StorageModeNameStep = ({
  formMethods,
  onSubmit,
  isLoading,
}: StorageModeNameStepProps): JSX.Element => {
  const {
    register,
    formState: { errors },
  } = formMethods

  const formTitleValidationRules = useFormTitleValidationRules()

  return (
    <Stack spacing="2rem" maxW="32rem">
      <Box>
        <Text textStyle="h2" color="secondary.700" mb="0.5rem">
          Set up a Storage mode form
        </Text>
        <Text textStyle="body-1" color="secondary.400">
          Storage mode is outdated and no longer receives new features. Only use
          this if you need a feature not yet available in the current version.
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

      <Button
        rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
        onClick={onSubmit}
        isLoading={isLoading}
        isFullWidth
      >
        Create form
      </Button>
    </Stack>
  )
}
