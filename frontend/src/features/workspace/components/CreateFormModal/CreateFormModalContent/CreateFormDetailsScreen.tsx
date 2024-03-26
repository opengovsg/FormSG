import { Controller } from 'react-hook-form'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  FormControl,
  ModalBody,
  ModalHeader,
  Skeleton,
  Text,
} from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types/form/form'

import { GUIDE_PREVENT_EMAIL_BOUNCE } from '~constants/links'
import { FORM_TITLE_VALIDATION_RULES } from '~utils/formValidation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormFieldMessage from '~components/FormControl/FormFieldMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'

import { useUser } from '~features/user/queries'

import { WorkspaceRowsProvider } from '../../WorkspaceFormRow/WorkspaceRowsContext'
import { useCreateFormWizard } from '../CreateFormWizardContext'

import { EmailFormRecipientsInput } from './EmailFormRecipientsInput'
import { FormResponseOptions } from './FormResponseOptions'

/** The length of form title to start showing warning text */
const FORM_TITLE_LENGTH_WARNING = 65

export const CreateFormDetailsScreen = (): JSX.Element => {
  const {
    formMethods,
    handleDetailsSubmit,
    isLoading,
    isFetching,
    modalHeader,
    isSingpass,
  } = useCreateFormWizard()
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = formMethods

  const titleInputValue = watch('title')
  const responseModeValue = watch('responseMode')

  const { user } = useUser()
  const showMrf = Boolean(user?.betaFlags?.mrf)

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW={showMrf ? '69.5rem' : '42.5rem'} p={0}>
          {modalHeader}
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW={showMrf ? '69.5rem' : '42.5rem'} p={0}>
          <FormControl isRequired isInvalid={!!errors.title} mb="2.25rem">
            <FormLabel useMarkdownForDescription>Form name</FormLabel>
            <Skeleton isLoaded={!isFetching}>
              <Input
                autoFocus
                {...register('title', FORM_TITLE_VALIDATION_RULES)}
              />
            </Skeleton>
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
            <Skeleton isLoaded={!isFetching}>
              <Controller
                name="responseMode"
                control={control}
                render={({ field }) => (
                  <WorkspaceRowsProvider>
                    <FormResponseOptions
                      {...field}
                      showMrf={showMrf}
                      isSingpass={isSingpass}
                    />
                  </WorkspaceRowsProvider>
                )}
                rules={{ required: 'Please select a form response mode' }}
              />
            </Skeleton>
            <FormErrorMessage>{errors.responseMode?.message}</FormErrorMessage>
            {isSingpass && (
              <InlineMessage mt="2rem">
                The form you are trying to duplicate has Singpass authentication
                which is not supported for Multi-respondent forms.
              </InlineMessage>
            )}
          </FormControl>
          {responseModeValue === FormResponseMode.Email && (
            <FormControl isRequired isInvalid={!!errors.emails} mb="2.25rem">
              <FormLabel
                useMarkdownForDescription
                description={`Specify up to 30 emails. [How to guard against bounce emails](${GUIDE_PREVENT_EMAIL_BOUNCE}).`}
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
            isDisabled={isFetching}
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
