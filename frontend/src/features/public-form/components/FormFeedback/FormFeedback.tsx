import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { chakra, Flex, FormControl } from '@chakra-ui/react'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Textarea from '~components/Textarea'

import { usePublicFormMutations } from '~features/public-form/mutations'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { SmileyRating } from './SmileyRating'
import { SubmitSuccess } from './SubmitSuccess'

export const FormFeedback = (): JSX.Element => {
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false)
  const { formId } = usePublicFormContext()
  const { submitFormFeedbackMutation } = usePublicFormMutations(formId)
  const {
    control,
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<{ rating: number; feedback: string }>({})

  const onSubmit = handleSubmit((inputs) => {
    return submitFormFeedbackMutation.mutate(
      {
        rating: inputs.rating,
        comment: inputs.feedback,
      },
      {
        onSuccess: () => setHasSubmittedFeedback(true),
      },
    )
  })

  if (hasSubmittedFeedback) {
    return <SubmitSuccess />
  }

  return (
    <Flex justify="center" py="1.5rem" px="1rem">
      <chakra.form w="42.5rem" maxW="100%" noValidate onSubmit={onSubmit}>
        <FormControl isInvalid={!!errors.rating} id="rating">
          <FormLabel isRequired>
            How was your form filling experience today?
          </FormLabel>
          <Controller
            rules={{ required: 'Please select a rating' }}
            control={control}
            name="rating"
            render={({ field }) => (
              <SmileyRating
                isReadOnly={submitFormFeedbackMutation.isLoading}
                {...field}
              />
            )}
          />
          <FormErrorMessage>{errors.rating?.message}</FormErrorMessage>
        </FormControl>
        <Textarea
          isReadOnly={submitFormFeedbackMutation.isLoading}
          mt="1rem"
          {...register('feedback')}
          aria-describedby="Enter detailed feedback here"
          placeholder="Enter detailed feedback here"
        />
        <Button
          mt="1.5rem"
          isFullWidth
          type="submit"
          isLoading={submitFormFeedbackMutation.isLoading}
        >
          Submit feedback
        </Button>
      </chakra.form>
    </Flex>
  )
}
