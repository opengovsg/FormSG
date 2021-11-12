import { Controller } from 'react-hook-form'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  FormControl,
  ModalBody,
  ModalHeader,
} from '@chakra-ui/react'

import { FORM_TITLE_VALIDATION_RULES } from '~utils/formValidation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormFieldMessage from '~components/FormControl/FormFieldMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useCreateFormWizard } from './CreateFormWizardContext'
import { FormResponseOptions } from './FormResponseOptions'

/** The length of form title to start showing warning text */
const FORM_TITLE_LENGTH_WARNING = 65

export const CreateFormDetailsScreen = (): JSX.Element => {
  const { formMethods, handleDetailsSubmit } = useCreateFormWizard()
  const {
    register,
    control,
    formState: { errors, isSubmitting },
    watch,
  } = formMethods

  const titleInputValue = watch('title')

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="42.5rem" p={0}>
          Set up your form
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-line">
        <Container maxW="42.5rem" p={0}>
          <FormControl isRequired isInvalid={!!errors.title} mb="2.25rem">
            <FormLabel>Form name</FormLabel>
            <Input {...register('title', FORM_TITLE_VALIDATION_RULES)} />
            <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
            {titleInputValue?.length > FORM_TITLE_LENGTH_WARNING ? (
              <FormFieldMessage>
                It is advised to use a shorter, more succinct form name.
              </FormFieldMessage>
            ) : null}
          </FormControl>
          <FormControl isRequired isInvalid={!!errors.responseMode} mb="2.5rem">
            <FormLabel>
              How do you want to receive your form responses?
            </FormLabel>
            <Controller
              name="responseMode"
              control={control}
              render={({ field }) => <FormResponseOptions {...field} />}
              rules={{ required: 'Please select a form response mode' }}
            />
            <FormErrorMessage>{errors.responseMode?.message}</FormErrorMessage>
          </FormControl>
          <Button
            rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
            type="submit"
            isLoading={isSubmitting}
            onClick={handleDetailsSubmit}
            isFullWidth
          >
            Next step
          </Button>
        </Container>
      </ModalBody>
    </>
  )
}
