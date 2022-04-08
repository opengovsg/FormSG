import { Controller, useForm } from 'react-hook-form'
import { chakra, Flex, FormControl } from '@chakra-ui/react'

import Button from '~components/Button'
import Rating from '~components/Field/Rating'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Textarea from '~components/Textarea'

export type FeedbackFormInput = {
  rating: number
  comment?: string
}

export interface FeedbackBlockProps {
  onSubmit: (input: FeedbackFormInput) => void
}

export const FeedbackBlock = ({
  onSubmit,
}: FeedbackBlockProps): JSX.Element => {
  const {
    control,
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<FeedbackFormInput>()

  const handleFormSubmit = handleSubmit((inputs) => onSubmit(inputs))

  return (
    <Flex justify="center">
      <chakra.form
        w="42.5rem"
        maxW="100%"
        noValidate
        onSubmit={handleFormSubmit}
      >
        <FormControl isInvalid={!!errors.rating} id="rating">
          <FormLabel isRequired>
            How was your form filling experience today?
          </FormLabel>
          <Controller
            rules={{ required: 'Please select a rating' }}
            control={control}
            name="rating"
            render={({ field }) => (
              <Rating numberOfRatings={5} variant="star" {...field} />
            )}
          />
          <FormErrorMessage>{errors.rating?.message}</FormErrorMessage>
        </FormControl>
        <Textarea
          isReadOnly={isSubmitting}
          mt="1rem"
          {...register('comment')}
          aria-label="Tell us more about your experience"
          placeholder="Tell us more about your experience"
        />
        <Button
          mt="1.5rem"
          variant="outline"
          type="submit"
          isLoading={isSubmitting}
        >
          Submit feedback
        </Button>
      </chakra.form>
    </Flex>
  )
}
