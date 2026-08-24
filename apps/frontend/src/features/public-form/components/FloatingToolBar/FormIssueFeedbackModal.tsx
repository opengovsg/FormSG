import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import {
  chakra,
  FormControl,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import { BasicField, SubmitFormIssueBodyDto } from 'formsg-shared/types'

import { ThemeColorScheme } from '~theme/foundations/colours'
import { INVALID_EMAIL_ERROR, REQUIRED_ERROR } from '~constants/validation'
import { useIsMobile } from '~hooks/useIsMobile'
import { useToast } from '~hooks/useToast'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import { ModalCloseButton } from '~components/Modal'
import Textarea from '~components/Textarea'

import { useSubmitFormIssueMutations } from '~features/public-form/mutations'

export interface FormIssueFeedbackProps {
  isOpen: boolean
  onClose: () => void
  isPreview: boolean
  formId: string
  colorScheme?: ThemeColorScheme
}

export const FormIssueFeedbackModal = ({
  isOpen,
  onClose,
  isPreview,
  formId,
  colorScheme,
}: FormIssueFeedbackProps): JSX.Element | null => {
  const { t } = useTranslation()

  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  const isMobile = useIsMobile()
  const toast = useToast({ status: 'success', isClosable: true })

  const { submitFormIssueMutation } = useSubmitFormIssueMutations(formId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubmitFormIssueBodyDto>({
    defaultValues: { issue: '', email: '' },
  })

  const handleSubmitIssue = handleSubmit((inputs: SubmitFormIssueBodyDto) => {
    if (isPreview) {
      reset()
      toast({
        description: t(
          'features.publicForm.components.formIssueFeedbackModal.toast.preview',
        ),
      })
    } else {
      submitFormIssueMutation.mutate(inputs, {
        onSuccess: () => {
          reset()
          toast({
            description: t(
              'features.publicForm.components.formIssueFeedbackModal.toast.success',
            ),
            status: 'success',
            isClosable: true,
          })
        },
      })
    }
    onClose()
  })

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <chakra.form noValidate onSubmit={handleSubmitIssue}>
          <ModalHeader
            pt="2rem"
            pb={{ base: '1.625rem', xs: '2rem' }}
            pr="4rem"
          >
            <Text textStyle={{ base: '1.25rem', md: '1.5rem' }}>
              {t('features.publicForm.components.formIssueFeedbackModal.title')}
            </Text>
          </ModalHeader>
          <ModalBody>
            <Text pb="1.5rem" textStyle="body-2" mt="0">
              <Trans
                i18nKey="features.publicForm.components.formIssueFeedbackModal.description"
                components={{
                  bold: <span style={{ fontWeight: 'bold' }} />,
                }}
              />
            </Text>
            <Stack>
              <FormControl isInvalid={!!errors.issue}>
                <FormLabel isRequired={true}>
                  {t(
                    'features.publicForm.components.formIssueFeedbackModal.fields.issueLabel',
                  )}
                </FormLabel>
                <Textarea
                  {...register('issue', {
                    required: REQUIRED_ERROR,
                  })}
                />
                <FormErrorMessage>
                  {errors.issue && errors.issue.message}
                </FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.email}>
                <FormLabel pt="1rem">{t('features.common.contact')}</FormLabel>
                <Input
                  type={BasicField.Email}
                  placeholder={t(
                    'features.publicForm.components.formIssueFeedbackModal.fields.emailPlaceholder',
                  )}
                  {...register('email', {
                    validate: {
                      validEmail: (value) =>
                        !value || isEmail(value) || INVALID_EMAIL_ERROR,
                    },
                  })}
                />
                <FormErrorMessage>
                  {errors.email && errors.email.message}
                </FormErrorMessage>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter mt={{ base: '2.5rem', md: '0' }}>
            <Stack
              w="100%"
              spacing="1rem"
              justify="right"
              direction={{ base: 'column-reverse', md: 'row' }}
            >
              <Button
                isFullWidth={isMobile}
                variant="clear"
                onClick={onClose}
                colorScheme={colorScheme}
              >
                {t('features.common.cancel')}
              </Button>
              <Button
                isFullWidth={isMobile}
                type="submit"
                colorScheme={colorScheme}
              >
                {t(
                  'features.publicForm.components.formIssueFeedbackModal.actions.submit',
                )}
              </Button>
            </Stack>
          </ModalFooter>
        </chakra.form>
      </ModalContent>
    </Modal>
  )
}
