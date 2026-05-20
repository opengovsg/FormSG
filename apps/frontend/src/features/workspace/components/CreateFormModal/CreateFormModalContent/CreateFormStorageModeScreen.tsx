import { RegisterOptions } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiArrowBack, BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  Flex,
  FormControl,
  ModalBody,
  ModalHeader,
  Skeleton,
  Text,
} from '@chakra-ui/react'

import { useFormTitleValidationRules } from '~utils/formValidation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormFieldMessage from '~components/FormControl/FormFieldMessage'
import FormLabel from '~components/FormControl/FormLabel'
import IconButton from '~components/IconButton'
import Input from '~components/Input'

import {
  CreateFormWizardInputProps,
  useCreateFormWizard,
} from '../CreateFormWizardContext'

const FORM_TITLE_LENGTH_WARNING = 65

export const CreateFormStorageModeScreen = (): JSX.Element => {
  const { t } = useTranslation()
  const {
    formMethods,
    handleCreateStorageModeOrMultirespondentForm,
    isLoading,
    isFetching,
    goToMrfDetails,
  } = useCreateFormWizard()
  const {
    register,
    formState: { errors },
    watch,
  } = formMethods

  const titleInputValue = watch('title')
  const formTitleValidationRules = useFormTitleValidationRules()

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="45rem" p={0}>
          <Flex align="center">
            <IconButton
              variant="clear"
              aria-label="Back"
              icon={<BiArrowBack />}
              onClick={goToMrfDetails}
              mr="0.5rem"
            />
            Set up a Storage mode form
          </Flex>
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW="45rem" p={0}>
          <Text textStyle="body-2" color="secondary.500" mb="2rem">
            Storage mode is outdated and no longer receives new features. Only
            use this if you need a feature not yet available in the current
            version.
          </Text>
          <FormControl isRequired isInvalid={!!errors.title} mb="2.25rem">
            <FormLabel useMarkdownForDescription>
              {t('features.workspace.modals.forms.create.details.name.label')}
            </FormLabel>
            <Skeleton isLoaded={!isFetching}>
              <Input
                autoFocus
                {...register(
                  'title',
                  formTitleValidationRules as RegisterOptions<
                    CreateFormWizardInputProps,
                    'title'
                  >,
                )}
              />
            </Skeleton>
            <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
            {titleInputValue?.length > FORM_TITLE_LENGTH_WARNING ? (
              <FormFieldMessage>
                {t(
                  'features.workspace.modals.forms.create.details.name.message',
                )}
              </FormFieldMessage>
            ) : null}
          </FormControl>
          <Button
            rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
            type="submit"
            isLoading={isLoading}
            isDisabled={isFetching}
            onClick={handleCreateStorageModeOrMultirespondentForm}
            isFullWidth
            data-dd-action-name="dashboard.create.create_encrypt"
          >
            <Text lineHeight="1.5rem">
              {t('features.workspace.modals.forms.create.details.create')}
            </Text>
          </Button>
        </Container>
      </ModalBody>
    </>
  )
}
