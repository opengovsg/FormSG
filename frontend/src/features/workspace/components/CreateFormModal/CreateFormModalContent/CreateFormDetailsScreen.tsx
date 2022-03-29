import { Controller } from 'react-hook-form'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  FormControl,
  ModalBody,
  ModalHeader,
  Text,
} from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types/form/form'

import { FORM_TITLE_VALIDATION_RULES } from '~utils/formValidation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormFieldMessage from '~components/FormControl/FormFieldMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useCreateFormWizard } from '../CreateFormWizardContext'

import { EmailFormRecipientsInput } from './EmailFormRecipientsInput'
import { FormResponseOptions } from './FormResponseOptions'

/** The length of form title to start showing warning text */
const FORM_TITLE_LENGTH_WARNING = 65

export const CreateFormDetailsScreen = (): JSX.Element => {
  const { formMethods, handleDetailsSubmit, isLoading } = useCreateFormWizard()
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = formMethods

  const titleInputValue = watch('title')
  const responseModeValue = watch('responseMode')

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
            <FormLabel useMarkdownForDescription>Form name</FormLabel>
            <Input
              autoFocus
              {...register('title', FORM_TITLE_VALIDATION_RULES)}
            />
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
          {responseModeValue === FormResponseMode.Email && (
            <FormControl isRequired isInvalid={!!errors.emails} mb="2.25rem">
              <FormLabel
                useMarkdownForDescription
                description="Specify up to 30 emails. [How to guard against bounce emails](https://go.gov.sg/form-prevent-bounce)."
              >
                Emails where responses will be sent
              </FormLabel>
              <EmailFormRecipientsInput />
            </FormControl>
          )}
          <Button
            rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
            type="submit"
            isLoading={isLoading}
            onClick={handleDetailsSubmit}
            isFullWidth
          >
            <Text lineHeight="1.5rem">Next step</Text>
          </Button>
        </Container>
      </ModalBody>
    </>
  )
}
