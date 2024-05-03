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
import {
  Button,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Infobox,
  Input,
} from '@opengovsg/design-system-react'

import { FormResponseMode } from '~shared/types/form/form'

import { GUIDE_PREVENT_EMAIL_BOUNCE } from '~constants/links'
import { FORM_TITLE_VALIDATION_RULES } from '~utils/formValidation'
import { MarkdownText } from '~components/MarkdownText'

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

  return (
    <>
      <ModalHeader color="brand.secondary.700">
        <Container maxW="69.5rem" p={0}>
          {modalHeader}
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW="69.5rem" p={0}>
          <FormControl isRequired isInvalid={!!errors.title} mb="2.25rem">
            <FormLabel>Form name</FormLabel>
            <Skeleton isLoaded={!isFetching}>
              <Input
                autoFocus
                {...register('title', FORM_TITLE_VALIDATION_RULES)}
              />
            </Skeleton>
            <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
            {titleInputValue?.length > FORM_TITLE_LENGTH_WARNING ? (
              <FormHelperText>
                It is advised to use a shorter, more succinct form name.
              </FormHelperText>
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
                    <FormResponseOptions {...field} isSingpass={isSingpass} />
                  </WorkspaceRowsProvider>
                )}
                rules={{ required: 'Please select a form response mode' }}
              />
            </Skeleton>
            <FormErrorMessage>{errors.responseMode?.message}</FormErrorMessage>
            {isSingpass && (
              <Infobox mt="2rem">
                The form you are trying to duplicate has Singpass authentication
                which is not supported for Multi-respondent forms.
              </Infobox>
            )}
          </FormControl>
          {responseModeValue === FormResponseMode.Email && (
            <FormControl isRequired isInvalid={!!errors.emails} mb="2.25rem">
              <FormLabel
                description={
                  <MarkdownText>{`Specify up to 30 emails. [How to guard against bounce emails](${GUIDE_PREVENT_EMAIL_BOUNCE}).`}</MarkdownText>
                }
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
