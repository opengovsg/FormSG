import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  FormControl,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Stack,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { FORM_ORIGIN_OPTIONS } from 'formsg-shared/constants'
import { FormOrigin } from 'formsg-shared/types/form/form'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import { ModalCloseButton } from '~components/Modal'
import Radio from '~components/Radio'

// Same question and answers as the origin step when creating a form.
const I18N_PREFIX = 'features.workspace.modals.forms.create.origin'

export interface FormOriginOnOpenModalProps extends Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
> {
  isLoading: boolean
  onSubmit: (formOrigin: FormOrigin) => void
  /** Shown above the question, e.g. the progress indicator. */
  header?: React.ReactNode
}

/**
 * Asks how a form's information was collected before FormSG, when a form
 * that was never asked is opened. Step 1 of 2, before the secret key.
 */
export const FormOriginOnOpenModal = ({
  isOpen,
  onClose,
  isLoading,
  onSubmit,
  header,
}: FormOriginOnOpenModalProps): JSX.Element => {
  const { t } = useTranslation()
  const question = t(`${I18N_PREFIX}.question`)
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ formOrigin?: FormOrigin }>()

  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalCloseButton />
        {header}
        <ModalHeader color="secondary.500">
          <Container maxW="42.5rem">{question}</Container>
        </ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Container maxW="42.5rem">
            <form
              noValidate
              onSubmit={handleSubmit(({ formOrigin }) => {
                if (formOrigin) onSubmit(formOrigin)
              })}
            >
              <FormControl
                isRequired
                isInvalid={!!errors.formOrigin}
                isDisabled={isLoading}
              >
                <Controller
                  name="formOrigin"
                  control={control}
                  rules={{
                    required: t(`${I18N_PREFIX}.errors.required`),
                  }}
                  render={({ field: { value, onChange } }) => (
                    <Radio.RadioGroup
                      aria-label={question}
                      value={value ?? ''}
                      onChange={onChange}
                    >
                      <Stack spacing="0.5rem">
                        {FORM_ORIGIN_OPTIONS.map((code) => (
                          <Radio key={code} value={code}>
                            {t(`${I18N_PREFIX}.options.${code}`)}
                          </Radio>
                        ))}
                      </Stack>
                    </Radio.RadioGroup>
                  )}
                />
                <FormErrorMessage>
                  {errors.formOrigin?.message}
                </FormErrorMessage>
              </FormControl>
              <Button
                mt="2.5rem"
                rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
                type="submit"
                isFullWidth
                isLoading={isLoading}
              >
                {t(`${I18N_PREFIX}.cta.next`)}
              </Button>
            </form>
          </Container>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
