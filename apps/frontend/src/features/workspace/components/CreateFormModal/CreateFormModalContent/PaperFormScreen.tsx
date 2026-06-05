import { Controller, useFormState } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Box,
  Container,
  FormControl,
  ModalBody,
  ModalHeader,
  SimpleGrid,
  Text,
} from '@chakra-ui/react'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'

import { PaperFormAnswer } from '~features/workspace/utils/formMetadata'

import { useCreateFormWizard } from '../CreateFormWizardContext'

interface PaperFormOptionProps {
  label: string
  isSelected: boolean
  onClick: () => void
}

const PaperFormOption = ({
  label,
  isSelected,
  onClick,
}: PaperFormOptionProps): JSX.Element => {
  return (
    <Box
      as="button"
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onClick}
      textAlign="left"
      px="1rem"
      py="1.25rem"
      borderRadius="0.25rem"
      bg={isSelected ? 'primary.100' : 'white'}
      border="1px solid"
      borderColor={isSelected ? 'primary.500' : 'neutral.400'}
      _hover={{ borderColor: isSelected ? 'primary.500' : 'neutral.500' }}
      _focusVisible={{
        boxShadow: '0 0 0 2px var(--chakra-colors-primary-500)',
        outline: 'none',
      }}
    >
      <Text textStyle="body-1" color="secondary.700">
        {label}
      </Text>
    </Box>
  )
}

export const PaperFormScreen = (): JSX.Element => {
  const { t } = useTranslation()
  const {
    formMethods,
    handleCreateStorageModeOrMultirespondentForm,
    isLoading,
  } = useCreateFormWizard()
  const { control } = formMethods
  // Subscribe to form state via the control so this screen re-renders when
  // validation errors change — formMethods is shared through context, so
  // reading formMethods.formState directly here would not be reactive.
  const { errors } = useFormState({ control })

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="45rem" p={0}>
          {t('features.workspace.modals.forms.create.paperForm.title')}
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW="45rem" p={0}>
          <FormControl mt="2rem" isRequired isInvalid={!!errors.isPaperForm}>
            <Controller
              name="isPaperForm"
              control={control}
              rules={{
                validate: (value) =>
                  value === 'yes' ||
                  value === 'no' ||
                  t(
                    'features.workspace.modals.forms.create.paperForm.required',
                  ),
              }}
              render={({ field: { value, onChange } }) => (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing="1rem">
                  <PaperFormOption
                    label={t(
                      'features.workspace.modals.forms.create.paperForm.options.yes',
                    )}
                    isSelected={value === 'yes'}
                    onClick={() => onChange('yes' satisfies PaperFormAnswer)}
                  />
                  <PaperFormOption
                    label={t(
                      'features.workspace.modals.forms.create.paperForm.options.no',
                    )}
                    isSelected={value === 'no'}
                    onClick={() => onChange('no' satisfies PaperFormAnswer)}
                  />
                </SimpleGrid>
              )}
            />
            <FormErrorMessage>{errors.isPaperForm?.message}</FormErrorMessage>
          </FormControl>
          <Button
            mt="2.5rem"
            rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
            type="submit"
            isLoading={isLoading}
            onClick={handleCreateStorageModeOrMultirespondentForm}
            isFullWidth
          >
            <Text lineHeight="1.5rem">
              {t('features.workspace.modals.forms.create.paperForm.nextStep')}
            </Text>
          </Button>
        </Container>
      </ModalBody>
    </>
  )
}
