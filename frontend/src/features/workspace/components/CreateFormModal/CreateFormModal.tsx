import { Controller } from 'react-hook-form'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  FormControl,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import { ModalCloseButton } from '~components/Modal'

import {
  CreateFormWizardProvider,
  useCreateFormWizard,
} from './CreateFormWizardContext'
import { FormResponseOptions } from './FormResponseOptions'

export type CreateFormModalProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
>

const CreateDetailsScreen = () => {
  const { formMethods } = useCreateFormWizard()
  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
  } = formMethods

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="42.5rem" p={0}>
          Set up your form
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-line">
        <Container maxW="42.5rem" p={0}>
          <form
            onSubmit={handleSubmit((inputs) => console.log('submit', inputs))}
            noValidate
          >
            <FormControl isRequired isInvalid={!!errors.formName} mb="2.25rem">
              <FormLabel>Form name</FormLabel>
              <Input
                {...register('formName', {
                  required: 'Please enter a title for the form',
                })}
              />
              <FormErrorMessage>{errors.formName?.message}</FormErrorMessage>
            </FormControl>
            <FormControl
              isRequired
              isInvalid={!!errors.responseMode}
              mb="2.5rem"
            >
              <FormLabel>
                How do you want to receive your form responses?
              </FormLabel>
              <Controller
                name="responseMode"
                control={control}
                render={({ field }) => <FormResponseOptions {...field} />}
                rules={{ required: 'Please select a form response mode' }}
              />
              <FormErrorMessage>
                {errors.responseMode?.message}
              </FormErrorMessage>
            </FormControl>
            <Button
              rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
              type="submit"
              isFullWidth
            >
              Next step
            </Button>
          </form>
        </Container>
      </ModalBody>
    </>
  )
}

export const CreateFormModalContainer = (
  props: CreateFormModalProps,
): JSX.Element => {
  return (
    <CreateFormWizardProvider>
      <CreateFormModal {...props} />
    </CreateFormWizardProvider>
  )
}

export const CreateFormModal = ({
  onClose,
  isOpen,
}: CreateFormModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalCloseButton />
        <CreateDetailsScreen />
      </ModalContent>
    </Modal>
  )
}
